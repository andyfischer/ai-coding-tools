use serde::{Deserialize, Serialize};
use std::io::{self, Read, Write};
use std::process;
use std::env;
use std::fs::{OpenOptions, File};
use std::path::PathBuf;
use regex::Regex;
use chrono::Utc;
use clap::{Parser, Subcommand};

#[derive(Deserialize, Debug)]
struct HookInput {
    session_id: String,
    transcript_path: String,
    tool_name: String,
    tool_input: ToolInput,
}

#[derive(Deserialize, Debug)]
struct ToolInput {
    file_path: String,
    old_string: Option<String>,
    new_string: Option<String>,
}

#[derive(Serialize, Debug)]
struct HookOutput {
    #[serde(skip_serializing_if = "Option::is_none")]
    decision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    reason: Option<String>,
}

#[derive(Parser)]
#[command(name = "ts-hook-validator")]
#[command(about = "A TypeScript hook validator for Claude Code")]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Install the hook in Claude Code settings
    Install {
        /// Install location: 'user' for ~/.claude/settings.json or 'project' for .claude/settings.json
        location: String,
    },
}

#[derive(Serialize, Deserialize, Debug)]
struct ClaudeSettings {
    #[serde(default)]
    hooks: HookSettings,
    #[serde(flatten)]
    other: serde_json::Map<String, serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct HookSettings {
    #[serde(rename = "PreToolUse", default)]
    pre_tool_use: Vec<HookMatcher>,
}

#[derive(Serialize, Deserialize, Debug)]
struct HookMatcher {
    matcher: String,
    hooks: Vec<HookCommand>,
}

#[derive(Serialize, Deserialize, Debug)]
struct HookCommand {
    #[serde(rename = "type")]
    command_type: String,
    command: String,
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Install { location }) => {
            if let Err(e) = install_hook(&location) {
                eprintln!("Error installing hook: {}", e);
                process::exit(1);
            }
        }
        None => {
            // No subcommand provided, run as hook (read from stdin)
            run_hook_mode();
        }
    }
}

fn run_hook_mode() {
    let mut buffer = String::new();
    if let Err(e) = io::stdin().read_to_string(&mut buffer) {
        eprintln!("Error reading from stdin: {}", e);
        process::exit(1);
    }

    let input: HookInput = match serde_json::from_str(&buffer) {
        Ok(input) => input,
        Err(e) => {
            eprintln!("Error parsing JSON input: {}", e);
            process::exit(1);
        }
    };

    // Log input if logging is enabled
    log_message(&format!("INPUT: Received {} tool call for file: {}", 
                        input.tool_name, input.tool_input.file_path));

    // Only process Edit tool calls on TypeScript files
    if input.tool_name != "Edit" {
        log_message(&format!("SKIP: Not an Edit tool call ({})", input.tool_name));
        process::exit(0);
    }

    if !is_typescript_file(&input.tool_input.file_path) {
        log_message(&format!("SKIP: Not a TypeScript file ({})", input.tool_input.file_path));
        process::exit(0);
    }

    let result = analyze_edit(&input.tool_input);
    
    // Log output if logging is enabled
    let decision = result.decision.as_deref().unwrap_or("undefined");
    let reason = result.reason.as_deref().unwrap_or("No reason provided");
    log_message(&format!("OUTPUT: Decision: {}, Reason: {}", decision, reason));
    
    match serde_json::to_string(&result) {
        Ok(json) => println!("{}", json),
        Err(e) => {
            eprintln!("Error serializing output: {}", e);
            process::exit(1);
        }
    }
}

fn is_typescript_file(path: &str) -> bool {
    path.ends_with(".ts") || path.ends_with(".tsx")
}

fn analyze_edit(tool_input: &ToolInput) -> HookOutput {
    let old_string = tool_input.old_string.as_deref().unwrap_or("");
    let new_string = tool_input.new_string.as_deref().unwrap_or("");
    
    // Check for conditions that should auto-approve
    if should_auto_approve(old_string, new_string) {
        HookOutput {
            decision: Some("approve".to_string()),
            reason: Some("Auto-approved: Safe TypeScript edit detected".to_string()),
        }
    } else {
        // Return undefined decision (normal permission flow)
        HookOutput {
            decision: None,
            reason: None,
        }
    }
}

fn should_auto_approve(old_string: &str, new_string: &str) -> bool {
    // Auto-approve simple formatting changes
    if is_formatting_only_change(old_string, new_string) {
        return true;
    }
    
    // Auto-approve adding or modifying import statements
    if is_import_statement_change(old_string, new_string) {
        return true;
    }
    
    false
}

fn is_formatting_only_change(old_string: &str, new_string: &str) -> bool {
    // Remove all whitespace and compare
    let old_normalized = old_string.chars().filter(|c| !c.is_whitespace()).collect::<String>();
    let new_normalized = new_string.chars().filter(|c| !c.is_whitespace()).collect::<String>();
    old_normalized == new_normalized
}

fn is_import_statement_change(old_string: &str, new_string: &str) -> bool {
    // Check if both strings are import statements or one is empty (adding import)
    let import_regex = Regex::new(r"^\s*import\s+").unwrap();
    
    // If both are import statements, approve
    if import_regex.is_match(old_string) && import_regex.is_match(new_string) {
        return true;
    }
    
    // If adding an import statement (old is empty or whitespace-only)
    if old_string.trim().is_empty() && import_regex.is_match(new_string) {
        return true;
    }
    
    // If old is import and new is empty (removing import)
    if import_regex.is_match(old_string) && new_string.trim().is_empty() {
        return true;
    }
    
    false
}

fn install_hook(location: &str) -> Result<(), Box<dyn std::error::Error>> {
    let current_exe = env::current_exe()?;
    let current_exe_path = current_exe.to_string_lossy();
    
    let settings_path = match location {
        "user" => {
            let home_dir = dirs::home_dir()
                .ok_or("Could not find home directory")?;
            home_dir.join(".claude").join("settings.json")
        }
        "project" => {
            PathBuf::from(".claude").join("settings.json")
        }
        _ => {
            return Err(format!("Invalid location '{}'. Use 'user' or 'project'", location).into());
        }
    };

    // Create directory if it doesn't exist
    if let Some(parent) = settings_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Read existing settings or create new
    let mut settings = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)?;
        if content.trim().is_empty() {
            ClaudeSettings {
                hooks: HookSettings::default(),
                other: serde_json::Map::new(),
            }
        } else {
            serde_json::from_str(&content)?
        }
    } else {
        ClaudeSettings {
            hooks: HookSettings::default(),
            other: serde_json::Map::new(),
        }
    };

    // Create the hook configuration
    let hook_command = HookCommand {
        command_type: "command".to_string(),
        command: current_exe_path.to_string(),
    };

    let hook_matcher = HookMatcher {
        matcher: "Edit".to_string(),
        hooks: vec![hook_command],
    };

    // Check if a similar hook already exists
    let existing_hook = settings.hooks.pre_tool_use.iter()
        .find(|m| m.matcher == "Edit" && 
                 m.hooks.iter().any(|h| h.command.contains("ts-hook-validator")));

    if existing_hook.is_some() {
        println!("Hook already exists in settings. Updating...");
        settings.hooks.pre_tool_use.retain(|m| !(m.matcher == "Edit" && 
            m.hooks.iter().any(|h| h.command.contains("ts-hook-validator"))));
    }

    settings.hooks.pre_tool_use.push(hook_matcher);

    // Write back to file
    let json = serde_json::to_string_pretty(&settings)?;
    std::fs::write(&settings_path, json)?;

    println!("Successfully installed TypeScript hook validator to: {}", settings_path.display());
    println!("Hook command: {}", current_exe_path);
    
    Ok(())
}

fn log_message(message: &str) {
    // Only log if environment variable is set
    if env::var("TS_RUBBERSTAMP_ENABLE_LOGS").is_err() {
        return;
    }
    
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("tsrubberstamp.log")
    {
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
        if let Err(e) = writeln!(file, "[{}] {}", timestamp, message) {
            eprintln!("Warning: Failed to write to log file: {}", e);
        }
    } else {
        eprintln!("Warning: Failed to open log file for writing");
    }
}

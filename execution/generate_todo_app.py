#!/usr/bin/env python3
import os
import shutil

def main():
    root_dir = "/Users/sumitgupta/AI_PRACTISE/ANTIGRAVITY/Github YT"
    app_dir = os.path.join(root_dir, "app")

    print("Initializing Todo App relocation...")

    # Ensure app directory exists
    os.makedirs(app_dir, exist_ok=True)
    print(f"Created/verified directory: {app_dir}")

    # Files to relocate
    files = ["index.html", "index.css", "app.js"]
    success_count = 0

    for filename in files:
        src = os.path.join(root_dir, filename)
        dst = os.path.join(app_dir, filename)
        
        if os.path.exists(src):
            print(f"Relocating {filename} -> app/{filename}")
            shutil.move(src, dst)
            success_count += 1
        elif os.path.exists(dst):
            print(f"File {filename} is already in app/ directory.")
            success_count += 1
        else:
            print(f"Error: Source file {src} not found.")

    if success_count == len(files):
        print("Todo App successfully generated/relocated inside the 'app/' folder!")
    else:
        print(f"Warning: Only {success_count}/{len(files)} files were relocated successfully.")

if __name__ == "__main__":
    main()

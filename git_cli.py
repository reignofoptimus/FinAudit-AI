#!/usr/bin/env python
import os
import sys
import argparse
from pathlib import Path
from dulwich import porcelain
from dulwich.repo import Repo
from dulwich.ignore import IgnoreFilterManager

def get_repo():
    try:
        return Repo('.')
    except Exception:
        print("Fatal: not a git repository (or any of the parent directories): .git")
        sys.exit(1)

def is_ignored(path_str, ignore_manager):
    norm_path = path_str.replace('\\', '/')
    if norm_path.startswith('./'):
        norm_path = norm_path[2:]
        
    parts = norm_path.split('/')
    if 'node_modules' in parts or '__pycache__' in parts or '.git' in parts:
        return True
    if norm_path.endswith('.pyc') or norm_path.endswith('.db') or norm_path.endswith('.sqlite'):
        return True
    if 'frontend/dist' in norm_path or ('backend/uploads' in norm_path and not norm_path.endswith('.gitkeep')):
        return True
    if 'backend/reports' in norm_path and not norm_path.endswith('.gitkeep'):
        return True

    try:
        match = ignore_manager.find_matching(norm_path)
        return bool(match)
    except Exception:
        return False

def cmd_add(args):
    repo = get_repo()
    ignore_manager = IgnoreFilterManager.from_repo(repo)
    
    files_to_add = []
    for root, dirs, files in os.walk('.'):
        # Prune unwanted directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'dist']]
            
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '.')
            rel_path_fwd = rel_path.replace('\\', '/')
            if not is_ignored(rel_path_fwd, ignore_manager):
                files_to_add.append(rel_path_fwd)

    if files_to_add:
        repo.stage([f.encode('utf-8') for f in files_to_add])
        print(f"Successfully staged {len(files_to_add)} files.")
    else:
        print("No files to add.")

def cmd_commit(args):
    repo = get_repo()
    message = args.message if args.message else "Initial commit: FinAudit AI full-stack application"
    author = "FinAudit Developer <developer@finaudit.ai>"
    
    commit_sha = porcelain.commit(
        repo,
        message=message.encode('utf-8'),
        author=author.encode('utf-8'),
        committer=author.encode('utf-8')
    )
    sha_str = commit_sha.decode() if isinstance(commit_sha, bytes) else str(commit_sha)
    print(f"[main {sha_str[:7]}] {message}")

def cmd_status(args):
    repo = get_repo()
    status = porcelain.status(repo)
    print("On branch main")
    
    staged_add = status.staged.get('add', [])
    staged_mod = status.staged.get('modify', [])
    total_staged = len(staged_add) + len(staged_mod)
    print(f"Staged changes: {total_staged} file(s)")
    if total_staged > 0 and total_staged <= 15:
        for f in staged_add + staged_mod:
            print(f"  new file: {f.decode() if isinstance(f, bytes) else f}")
            
    untracked = status.untracked
    # Filter out ignored from untracked report
    ignore_manager = IgnoreFilterManager.from_repo(repo)
    real_untracked = [u for u in untracked if not is_ignored(u.decode() if isinstance(u, bytes) else u, ignore_manager)]
    print(f"Untracked files: {len(real_untracked)} file(s)")

def cmd_remote(args):
    repo = get_repo()
    if args.action == "add":
        name = args.name
        url = args.url
        porcelain.remote_add(repo, name, url)
        print(f"Added remote '{name}' -> {url}")
    elif args.action in ["-v", "list"]:
        config = repo.get_config()
        try:
            for section in config.sections():
                if section[0] == b'remote':
                    r_name = section[1].decode()
                    r_url = config.get(section, b'url').decode()
                    print(f"{r_name}\t{r_url} (fetch)")
                    print(f"{r_name}\t{r_url} (push)")
        except Exception:
            pass

def cmd_push(args):
    repo = get_repo()
    remote = args.remote or "origin"
    branch = args.branch or "main"
    
    config = repo.get_config()
    try:
        remote_url = config.get((b'remote', remote.encode()), b'url').decode()
    except KeyError:
        remote_url = remote

    print(f"Pushing to {remote_url} (branch: {branch})...")
    try:
        porcelain.push(repo, remote_url, refspecs=[f"refs/heads/{branch}:refs/heads/{branch}"])
        print("Push completed successfully!")
    except Exception as e:
        print(f"Push error: {e}")
        print("\nTo push to GitHub, GitLab, or Bitbucket over HTTPS, set the remote with your personal access token:")
        print("  python git_cli.py remote add origin https://<TOKEN>@github.com/<USERNAME>/<REPO>.git")
        print("  python git_cli.py push origin main")

def main():
    if len(sys.argv) < 2:
        print("Usage: python git_cli.py [status|add|commit|remote|push] [options]")
        sys.exit(1)
        
    cmd = sys.argv[1].lower()
    if cmd == "status":
        cmd_status(None)
    elif cmd == "add":
        cmd_add(None)
    elif cmd == "commit":
        parser = argparse.ArgumentParser()
        parser.add_argument("-m", "--message", default="Initial commit: FinAudit AI full-stack application")
        args = parser.parse_args(sys.argv[2:])
        cmd_commit(args)
    elif cmd == "remote":
        if len(sys.argv) > 2 and sys.argv[2] == "add":
            name = sys.argv[3] if len(sys.argv) > 3 else "origin"
            url = sys.argv[4] if len(sys.argv) > 4 else ""
            cmd_remote(type('Args', (), {'action': 'add', 'name': name, 'url': url}))
        else:
            cmd_remote(type('Args', (), {'action': '-v'}))
    elif cmd == "push":
        remote = sys.argv[2] if len(sys.argv) > 2 else "origin"
        branch = sys.argv[3] if len(sys.argv) > 3 else "main"
        cmd_push(type('Args', (), {'remote': remote, 'branch': branch}))
    else:
        print(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()

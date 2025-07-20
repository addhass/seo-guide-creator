# When to Press ESCAPE vs Wait - Claude Code Guide

## 🎯 Quick Reference

### ✅ SAFE to Press ESCAPE (Background Operations)
These run in the background and don't need to complete:

1. **Starting servers with background scripts**
   - `./start-server-background.sh`
   - After seeing "Server is running successfully!"
   - The server continues running independently

2. **Opening files/URLs in browser**
   - `open filename.html`
   - Browser opens immediately, no need to wait

3. **Background processes with `&`**
   - Commands ending with `&` or using `nohup`
   - Process continues after escape

### ⏳ WAIT for Completion (Critical Operations)
These need to finish for proper results:

1. **Installation commands**
   - `npm install`, `pip install`, etc.
   - Wait for "installation complete" message
   - Interrupting may leave partial installs

2. **File operations**
   - Moving, copying, deleting multiple files
   - Let it complete to ensure all files processed

3. **Testing or analysis commands**
   - `npm test`, curl commands for testing
   - Need to see the results

4. **Git operations**
   - `git commit`, `git push`
   - Important to complete fully

## 📋 Visual Cues in Scripts

I'll use these indicators in scripts:

```bash
# Background operation - safe to escape
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Safe to PRESS ESCAPE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Critical operation - please wait
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Please WAIT for completion"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 💡 General Rules

1. **Background = Escape OK**: If it runs independently, escape is fine
2. **Needs Results = Wait**: If I need to see output, wait for timeout
3. **Installation = Wait**: Package installs should complete
4. **Quick Checks = Either**: Health checks, status checks can be interrupted

## 🔧 Examples

### Escape OK:
```bash
./start-server-background.sh  # After confirmation
open product-guide.html       # Browser opens immediately
tail -f server.log &         # Runs in background
```

### Wait Please:
```bash
npm install express          # Need complete installation
curl http://localhost:3001/health  # Need to see response
npm test                    # Need test results
```

When in doubt, I'll always indicate which is appropriate!
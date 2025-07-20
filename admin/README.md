# Admin Reports - Access Restricted

This directory contains admin-only tools and reports for the Platform Analysis system.

## 🔒 Security Notice

All tools in this directory require admin authentication. Reports generated here contain sensitive performance metrics and system data.

## Generating Admin Reports

To generate an admin report, you must provide valid admin credentials:

```bash
# Set admin token and generate report
ADMIN_TOKEN=your-secret-token node admin/generate-report.js
```

Default token for development: `admin-secret-2025`

## Report Features

Admin reports include:
- 📊 Detailed performance metrics
- 🎯 Platform-by-platform breakdown
- ⚠️ Backlog analysis
- 🔍 Pattern effectiveness metrics
- 📈 Historical performance data
- 🔐 Unique report IDs for tracking

## Security Measures

1. **Token Authentication**: Required for all operations
2. **Protected Directory**: Reports saved in `admin-reports/` with .htaccess protection
3. **Access Logging**: All report generation is logged
4. **Unique IDs**: Each report has a cryptographic ID

## Report Location

Generated reports are saved to:
```
admin-reports/admin-report-[ID]-[DATE].html
```

## Viewing Reports

Reports are HTML files with embedded styling. Open directly in a browser or serve via a protected web server.

## Production Deployment

For production use:
1. Change the default admin token
2. Use environment variables for credentials
3. Implement proper web server authentication
4. Consider database-backed access control

---

⚠️ **Important**: Never commit admin tokens or credentials to version control.
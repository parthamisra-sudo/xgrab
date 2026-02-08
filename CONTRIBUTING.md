# Contributing to XGrab

First off, thank you for considering contributing to XGrab! It's people like you that make XGrab such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 11, macOS 13]
 - Node Version: [e.g. 18.17.0]
 - Browser: [e.g. Chrome 120]
 - XGrab Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### Suggesting Features

Feature suggestions are welcome! Please create an issue with the following information:

**Feature Request Template:**
```
**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
Any alternative solutions you've thought of?

**Additional Context**
Mockups, examples, or references?
```

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write clear, descriptive commit messages
6. Update documentation as needed

**Pull Request Template:**
```
**Description**
What does this PR do?

**Related Issue**
Fixes #(issue number)

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
How has this been tested?

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass
```

## Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/xgrab.git
cd xgrab

# Install dependencies
npm install

# Create a branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Test your changes
npm test

# Commit and push
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
```

## Coding Standards

### JavaScript Style Guide
- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code structure

### Commit Messages
Use clear, descriptive commit messages:
- `Add: new feature description`
- `Fix: bug description`
- `Update: what was updated`
- `Docs: documentation changes`
- `Refactor: code improvement`

### File Organization
```
xgrab/
├── xgrab-frontend.html     # Frontend application
├── xgrab-server.js          # Backend server
├── package.json             # Dependencies
├── docs/                    # Documentation
└── tests/                   # Test files
```

## Testing

Before submitting a PR:
```bash
# Run tests
npm test

# Check for linting errors
npm run lint

# Test manually
npm start
# Open xgrab-frontend.html in browser
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments to new functions
- Update CHANGELOG.md with your changes
- Create/update relevant docs in `/docs` folder

## Community

- 💬 [GitHub Discussions](https://github.com/YOUR_USERNAME/xgrab/discussions) - Ask questions, share ideas
- 🐛 [GitHub Issues](https://github.com/YOUR_USERNAME/xgrab/issues) - Bug reports and feature requests
- 📧 Email - For security issues only

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- CHANGELOG.md for each release
- GitHub contributors page

## Questions?

Feel free to ask questions by:
- Creating a discussion thread
- Commenting on relevant issues
- Reaching out via email

Thank you for contributing to XGrab! 🎉
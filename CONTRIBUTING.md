# Contributing to Contri-AI

Thank you for your interest in contributing to Contri-AI! This document provides guidelines for contributing to this hackathon project.

## 🎯 Project Purpose

Contri-AI is a Web3 neural analytics platform built for hackathon demonstrations. The project showcases:
- Real-time contribution analytics
- Cyberpunk-themed UI design
- React + TypeScript best practices
- Production-ready deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- Code editor (VS Code recommended)

### Local Development
```bash
git clone https://github.com/0xClareYang/contri-ai-hackathon.git
cd contri-ai-hackathon
npm install
npm start
```

## 📋 Development Guidelines

### Code Style
- **TypeScript**: All new code must be written in TypeScript
- **Zero Warnings**: No TypeScript warnings or errors allowed
- **Components**: Use functional components with hooks
- **Styling**: Follow existing CSS custom property patterns

### File Organization
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # CSS modules or styled components
```

### Naming Conventions
- **Components**: PascalCase (e.g., `DataAnalyzer.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useRealTimeData.ts`)
- **CSS Classes**: kebab-case with cyber- prefix (e.g., `cyber-button`)
- **Files**: kebab-case for non-components (e.g., `api-client.ts`)

## 🎨 Design Guidelines

### Cyberpunk Theme
- **Colors**: Use CSS custom properties defined in `:root`
- **Animations**: Framer Motion for smooth transitions
- **Effects**: Matrix rain, neon glows, scan lines
- **Typography**: Monospace fonts for code/data displays

### Responsive Design
- **Mobile First**: Design for mobile, enhance for desktop
- **Breakpoints**: Follow existing media query patterns
- **Touch Friendly**: 44px minimum touch targets
- **Accessibility**: ARIA labels and semantic HTML

## 🔧 Technical Standards

### Component Structure
```typescript
interface ComponentProps {
  // Props with clear types
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="cyber-component">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### Performance Guidelines
- **Lazy Loading**: Use React.lazy for large components
- **Memoization**: React.memo for expensive renders
- **Optimization**: Minimize bundle size and render cycles
- **Real-time**: Efficient data update patterns

## 🐛 Bug Reports

### Before Submitting
1. Check existing issues
2. Test on latest version
3. Verify in different browsers

### Bug Report Template
```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What should happen instead.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Safari]
- Version: [e.g. 1.0.0]
```

## 💡 Feature Requests

### Enhancement Areas
- **Analytics**: New data visualization types
- **UI/UX**: Additional cyberpunk effects or interactions
- **Performance**: Optimization improvements
- **Accessibility**: Better screen reader support

### Feature Request Template
```markdown
**Feature Description**
Clear description of the proposed feature.

**Use Case**
Why would this feature be valuable?

**Implementation Ideas**
Any thoughts on how this could be implemented.

**Mockups/Examples**
Visual examples if applicable.
```

## 📝 Pull Request Process

### Before Submitting
1. **Fork** the repository
2. **Create** a feature branch (`feature/amazing-feature`)
3. **Test** your changes thoroughly
4. **Commit** with clear messages
5. **Update** documentation if needed

### PR Requirements
- [ ] All TypeScript warnings resolved
- [ ] Components are responsive
- [ ] Follows existing code patterns
- [ ] Includes relevant tests (if applicable)
- [ ] Documentation updated

### PR Template
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Responsive design verified
- [ ] Cross-browser compatibility checked

## Screenshots
Include screenshots for UI changes.
```

## 🎯 Hackathon Specific Guidelines

### Demo-Focused Development
- **Visual Impact**: Prioritize impressive visual features
- **Live Demo**: Ensure all features work in real-time
- **Performance**: Fast loading and smooth interactions
- **Presentation**: Clean, professional appearance

### Quick Win Features
- **Animations**: Eye-catching but smooth effects
- **Data Visualization**: Charts, graphs, live metrics
- **Interactivity**: Clickable elements with feedback
- **Mobile Support**: Touch-friendly design

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md for significant features
- Project documentation

## 📞 Contact

- **GitHub Issues**: Primary communication method
- **Project Lead**: 0xClareYang
- **Documentation**: See README.md and DEPLOYMENT_GUIDE.md

---

**Thank you for contributing to Contri-AI!** 🚀

*This project was built with Claude Code assistance and welcomes community contributions.*
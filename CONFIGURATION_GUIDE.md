# Configuration Guide for ESLint and Prettier

This guide explains how to configure ESLint and Prettier in your project.

---

## 1. Install ESLint
Run the following command to install ESLint:
```bash
npm install eslint --save-dev
```

### Initialize ESLint
Run the following command to create a `.eslintrc.json` file:
```bash
npx eslint --init
```
Follow the prompts to configure ESLint for your project. Based on your answers, required plugins and configurations will be installed automatically.

---

## 2. Install Prettier
Run the following command to install Prettier:
```bash
npm install prettier --save-dev
```

---

## 3. Integrate ESLint with Prettier
Install the following packages to integrate ESLint with Prettier:
```bash
npm install eslint-config-prettier eslint-plugin-prettier --save-dev
```

- `eslint-config-prettier`: Disables ESLint rules that might conflict with Prettier.
- `eslint-plugin-prettier`: Runs Prettier as an ESLint rule.

---

## 4. Create `.prettierrc`
Create a `.prettierrc` file in your project root to configure Prettier. Example:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## 5. Update `.eslintrc.json`
Update your `.eslintrc.json` file to include Prettier integration:
```json
{
  "extends": ["eslint:recommended", "plugin:prettier/recommended"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

---

## 6. Install Additional Plugins (Optional)
Depending on your project, you may need additional plugins:

### For React:
```bash
npm install eslint-plugin-react --save-dev
```

### For TypeScript:
```bash
npm install @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev
```

---

## 7. Format Code
To format your code, run:
```bash
npx prettier --write .
```

To lint your code, run:
```bash
npx eslint .
```

---

Follow these steps to ensure consistent code quality and formatting in your project.
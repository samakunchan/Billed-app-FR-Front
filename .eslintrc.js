module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "prettier"
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        'max-len': ['error', { 'code': 120 }],
        'getter-return': ["error", { allowImplicit: true }],
        'no-constant-condition': ["error", { "checkLoops": false }],
        semi: ["error", "always"]
    },
}

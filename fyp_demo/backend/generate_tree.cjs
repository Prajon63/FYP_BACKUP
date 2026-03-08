const fs = require('fs');
const path = require('path');

function getTree(dir, prefix = '') {
    const excludes = ['.git', 'node_modules', 'dist', 'build', 'coverage', 'uploads', '.next', '.vscode'];
    let output = '';

    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (e) { return ''; }

    files = files.filter(f => !excludes.includes(f));

    files.sort((a, b) => {
        const statsA = fs.statSync(path.join(dir, a));
        const statsB = fs.statSync(path.join(dir, b));
        if (statsA.isDirectory() && !statsB.isDirectory()) return -1;
        if (!statsA.isDirectory() && statsB.isDirectory()) return 1;
        return a.localeCompare(b);
    });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isLast = (i === files.length - 1);
        output += prefix + (isLast ? '└── ' : '├── ') + file + '\n';

        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            output += getTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    }
    return output;
}

const target = path.resolve('c:/Users/ACER/Desktop/fyp_backup/fyp_demo');
console.log('fyp_demo/');
console.log(getTree(target));

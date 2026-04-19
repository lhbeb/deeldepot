const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

function replaceInFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace getPaypalUnclaimedConfig
    content = content.replace(/getPaypalUnclaimedConfig/g, 'getPaypalDirectConfig');
    
    // Replace paypal-unclaimed literal
    content = content.replace(/paypal-unclaimed/g, 'paypal-direct');
    
    // Replace PayPal Unclaimed string
    content = content.replace(/PayPal Unclaimed/gi, 'PayPal Direct Checkout');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

walkDir('/Users/elma777boubi/Downloads/deeldepot/deeldepot/src', replaceInFile);

console.log("TypeScript file updates complete!");

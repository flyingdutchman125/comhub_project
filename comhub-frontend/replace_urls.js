import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = path.join(__dirname, 'src');

function findAndReplace(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findAndReplace(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updatedContent = content;

            // Simple replace for exact strings that might have been missed
            updatedContent = updatedContent.replace(
                /(?<!import\.meta\.env\.VITE_API_URL\s*\|\|\s*)'http:\/\/localhost:3000(.*?)'/g, 
                "`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`"
            );
            
            updatedContent = updatedContent.replace(
                /(?<!import\.meta\.env\.VITE_API_URL\s*\|\|\s*)"http:\/\/localhost:3000(.*?)"/g, 
                "`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`"
            );
            
            updatedContent = updatedContent.replace(
                /(?<!import\.meta\.env\.VITE_API_URL\s*\|\|\s*)`http:\/\/localhost:3000(.*?)`/g, 
                "`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`"
            );

            if (content !== updatedContent) {
                fs.writeFileSync(fullPath, updatedContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

console.log('Starting URL replacement...');
findAndReplace(directory);
console.log('URL replacement completed!');

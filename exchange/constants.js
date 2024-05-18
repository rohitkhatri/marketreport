const path = require('path');

const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const packageDir = path.dirname(__dirname);
const companiesCacheFile = `${packageDir}/_cache/companies.json`;

module.exports = {
    months,
    packageDir,
    companiesCacheFile
};
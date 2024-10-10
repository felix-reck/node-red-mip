function formatData(array,replaceDots) {
    const newArray = [];

    for (const obj of array) {
        if (obj.__rowType === 'DATA') {
            const data = obj.data;
            const metaData = {};

            for (let i = 0; i < data.length; i++) {
                const key = array[0].data[i].name;
                const value = data[i];
                metaData[key] = value;
            }
            const processedMetaData = replaceDots ? replaceDotsWithUnderscores(metaData) : metaData;
            newArray.push(processedMetaData);
        }
    }

    return newArray;
}

function replaceDotsWithUnderscores(obj) {
    const newObj = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = key.replace(/\./g, '_');
            newObj[newKey] = obj[key];
        }
    }

    return newObj;
}



module.exports = {
    formatData
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToNumber = convertToNumber;
exports.removeDuplicates = removeDuplicates;
exports.findValueById = findValueById;
function convertToNumber(value) {
    if (typeof value === 'number') {
        return value;
    }
    const parsedValue = Number(value);
    return isNaN(parsedValue) ? null : parsedValue;
}
function removeDuplicates(array, key) {
    return array.filter((item, index, self) => index === self.findIndex((t) => t[key] === item[key]));
}
function findValueById(array, id, key, valueKey) {
    // Convertir l'ID en nombre pour éviter des problèmes de type
    const numericId = Number(id);
    // Trouver l'élément qui correspond à l'ID
    const foundItem = array.find(item => item[key] === numericId);
    // Log pour afficher le tableau, l'ID recherché et l'élément trouvé
    console.log("Array:", array);
    console.log("ID:", numericId);
    console.log("Found Item:", foundItem);
    // Si l'élément est trouvé, retourne la valeur de la clé spécifique (valueKey)
    // Assurez-vous que la valeur retournée est du bon type
    return foundItem ? foundItem[valueKey] : undefined;
}

const originalName = "fichier-éàü.pdf";

console.log("Original:", originalName);
console.log("Original chars:", [...originalName].map(c => c + "=" + c.charCodeAt(0).toString(16)));

const normalized = originalName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
console.log("Normalized:", normalized);
console.log("Normalized chars:", [...normalized].map(c => c + "=" + c.charCodeAt(0).toString(16)));

const ext = ".pdf";
const nameWithoutExt = normalized.slice(0, -ext.length);
console.log("Name without ext:", nameWithoutExt);

const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9.\-_]/g, "_");
console.log("Clean name:", cleanName);
console.log("Result:", cleanName + ext);

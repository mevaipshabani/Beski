/**
 * Configuration Module for Remodeling Estimation App
 */
const CONFIG = {
    categories: {
        "tavan-gips": { name: "Tavan i Varur Drywall (Gips)", defaultPrice: 15.00 },
        "mure-gips": { name: "Mure Ndarëse Drywall (Gips)", defaultPrice: 18.00 },
        "lyerje-brendshme": { name: "Lyerje e Brendshme (Ngjyrë)", defaultPrice: 3.50 },
        "glet-llac": { name: "Suvatim / Lëshim në Glet", defaultPrice: 4.50 },
        "travertine": { name: "Punime Dekorative Travertine", defaultPrice: 25.00 },
        "kalahari": { name: "Punime Dekorative Kalahari", defaultPrice: 22.00 },
        "dekorime-tjera": { name: "Finishe & Dekorime të Tjera", defaultPrice: 20.00 },
        "punime-ndihmese": { name: "Punime Ndihmëse / Skelet", defaultPrice: 2.00 }
    },

    materialFormulas: [
        { item: "Pllaka Gipsi (Standarde/Ujë-rezistente)", unit: "m2", supportedCategories: ["tavan-gips", "mure-gips"], factor: 1.05 },
        { item: "Profile Metalike (CD/UD ose CW/UW)", unit: "Metra linear", supportedCategories: ["tavan-gips", "mure-gips"], factor: 3.20 },
        { item: "Vida Gipsi (Autoperforuese 25mm/35mm)", unit: "Copa", supportedCategories: ["tavan-gips", "mure-gips"], factor: 18 },
        { item: "Shirit Banda (Joint tape) për Fugat", unit: "Metra", supportedCategories: ["tavan-gips", "mure-gips"], factor: 1.4 },
        { item: "Ngjyrë / Bojë Brendshme (Akrilike/Plastike)", unit: "Litra", supportedCategories: ["lyerje-brendshme"], factor: 0.35 },
        { item: "Glet / Plaster Pluhur (Knauf/Fuga)", unit: "Kg", supportedCategories: ["glet-llac", "tavan-gips", "mure-gips"], factor: 1.25 },
        { item: "Masë Dekorative Travertine / Kalahari", unit: "Kg", supportedCategories: ["travertine", "kalahari"], factor: 2.10 }
    ]
};
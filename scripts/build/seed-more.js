"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase-admin/app");
var firestore_1 = require("firebase-admin/firestore");
var path_1 = __importDefault(require("path"));
// Initialise Firebase Admin
var serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require(path_1.default.resolve('./service-account.json'));
(0, app_1.initializeApp)({ credential: (0, app_1.cert)(serviceAccount) });
var db = (0, firestore_1.getFirestore)();
function seedMore() {
    return __awaiter(this, void 0, void 0, function () {
        var products, _i, products_1, product;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱  Starting AFINJU seed for more products...\n');
                    products = [
                        {
                            id: 'afinju-authority-set-red',
                            name: 'AFINJU Authority Set — Red Velvet',
                            slug: 'afinju-authority-set-red-velvet',
                            description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and vibrant red velvet.',
                            features: [
                                'Vibrant red velvet finish with gold crest emblem',
                                'Fully coordinated across all pieces',
                                'Each set produced to the buyer\'s exact shoe size, head size',
                                'Authentication card included',
                            ],
                            items: [
                                'Red Velvet Half Shoe',
                                'Matching Red Velvet Clutch',
                                'Matching Red Gobi Cap',
                            ],
                            price: 220000,
                            compareAtPrice: 280000,
                            currency: 'NGN',
                            colors: ['Red'],
                            images: [
                                { url: '/products/afinju_red_hero_1773322751923.png', alt: 'Red Authority Set Hero', publicId: 'local/red-hero' },
                                { url: '/products/afinju_red_detail_1773322771608.png', alt: 'Red Authority Set Detail', publicId: 'local/red-detail' },
                                { url: '/products/afinju_red_lifestyle_1773322801188.png', alt: 'Red Authority Set Lifestyle', publicId: 'local/red-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
                        },
                        {
                            id: 'afinju-authority-set-blue',
                            name: 'AFINJU Authority Set — Royal Blue',
                            slug: 'afinju-authority-set-royal-blue',
                            description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and royal blue velvet.',
                            features: [
                                'Royal blue velvet finish with gold crest emblem',
                                'Fully coordinated across all pieces',
                                'Each set produced to the buyer\'s exact shoe size, head size',
                                'Authentication card included',
                            ],
                            items: [
                                'Royal Blue Velvet Half Shoe',
                                'Matching Blue Velvet Clutch',
                                'Matching Blue Gobi Cap',
                            ],
                            price: 220000,
                            compareAtPrice: 280000,
                            currency: 'NGN',
                            colors: ['Blue'],
                            images: [
                                { url: '/products/afinju_blue_hero_1773322816739.png', alt: 'Blue Authority Set Hero', publicId: 'local/blue-hero' },
                                { url: '/products/afinju_blue_detail_1773322831998.png', alt: 'Blue Authority Set Detail', publicId: 'local/blue-detail' },
                                { url: '/products/afinju_blue_lifestyle_1773322849784.png', alt: 'Blue Authority Set Lifestyle', publicId: 'local/blue-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
                        },
                        {
                            id: 'afinju-authority-set-black',
                            name: 'AFINJU Authority Set — Midnight Black',
                            slug: 'afinju-authority-set-midnight-black',
                            description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and deep midnight black velvet.',
                            features: [
                                'Midnight black velvet finish with gold crest emblem',
                                'Fully coordinated across all pieces',
                                'Each set produced to the buyer\'s exact shoe size, head size',
                                'Authentication card included',
                            ],
                            items: [
                                'Black Velvet Half Shoe',
                                'Matching Black Velvet Clutch',
                                'Matching Black Gobi Cap',
                            ],
                            price: 220000,
                            compareAtPrice: 280000,
                            currency: 'NGN',
                            colors: ['Black'],
                            images: [
                                { url: '/products/afinju_black_hero_1773322894522.png', alt: 'Black Authority Set Hero', publicId: 'local/black-hero' },
                                { url: '/products/afinju_black_detail_1773322910632.png', alt: 'Black Authority Set Detail', publicId: 'local/black-detail' },
                                { url: '/products/afinju_black_lifestyle_1773322925749.png', alt: 'Black Authority Set Lifestyle', publicId: 'local/black-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
                        },
                        {
                            id: 'afinju-authority-set-brown',
                            name: 'AFINJU Authority Set — Chocolate Brown',
                            slug: 'afinju-authority-set-chocolate-brown',
                            description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and rich chocolate brown velvet.',
                            features: [
                                'Chocolate brown velvet finish with gold crest emblem',
                                'Fully coordinated across all pieces',
                                'Each set produced to the buyer\'s exact shoe size, head size',
                                'Authentication card included',
                            ],
                            items: [
                                'Brown Velvet Half Shoe',
                                'Matching Brown Velvet Clutch',
                                'Matching Brown Gobi Cap',
                            ],
                            price: 220000,
                            compareAtPrice: 280000,
                            currency: 'NGN',
                            colors: ['Brown'],
                            images: [
                                { url: '/products/afinju_brown_hero_1773322947363.png', alt: 'Brown Authority Set Hero', publicId: 'local/brown-hero' },
                                { url: '/products/afinju_brown_detail_1773322964094.png', alt: 'Brown Authority Set Detail', publicId: 'local/brown-detail' },
                                // Placeholder for missing lifestyle shot due to rate limit, fallback to detail shot
                                { url: '/products/afinju_brown_detail_1773322964094.png', alt: 'Brown Authority Set Lifestyle', publicId: 'local/brown-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
                        },
                        // The following 6 products are placeholders with generic unsplash URLs
                        {
                            id: 'afinju-executive-leather-briefcase',
                            name: 'AFINJU Executive Leather Briefcase',
                            slug: 'afinju-executive-leather-briefcase',
                            description: 'Premium Nigerian full-grain leather briefcase designed for the modern executive. Features brass hardware and microsuede interior lining.',
                            features: ['Full-grain Nigerian leather', 'Brass hardware', 'Microsuede interior lining', 'Multiple internal compartments'],
                            items: ['Leather Briefcase', 'Detachable Shoulder Strap', 'Dust Bag'],
                            price: 150000,
                            compareAtPrice: 180000,
                            currency: 'NGN',
                            colors: ['Brown', 'Black'],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=90', alt: 'Briefcase Hero', publicId: 'local/briefcase-hero' },
                                { url: 'https://images.unsplash.com/photo-1547949007-56e6ca97bcda?w=1200&q=90', alt: 'Briefcase Detail', publicId: 'local/briefcase-detail' },
                                { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=90', alt: 'Briefcase Lifestyle', publicId: 'local/briefcase-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 200, soldCount: 0, allowBackorder: true },
                        },
                        {
                            id: 'afinju-premium-leather-loafers',
                            name: 'AFINJU Premium Leather Loafers',
                            slug: 'afinju-premium-leather-loafers',
                            description: 'Hand-stitched premium men\'s leather loafers, offering exceptional comfort and classic style for the discerning gentleman.',
                            features: ['Full-grain leather', 'Hand-stitched detailing', 'Leather lining and sole', 'Cushioned insole'],
                            items: ['Pair of Loafers', 'Dust Bag', 'Shoe Horn'],
                            price: 120000,
                            compareAtPrice: 150000,
                            currency: 'NGN',
                            colors: ['Brown', 'Black'],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=90', alt: 'Loafers Hero', publicId: 'local/loafers-hero' },
                                { url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=90', alt: 'Loafers Detail', publicId: 'local/loafers-detail' },
                                { url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1200&q=90', alt: 'Loafers Lifestyle', publicId: 'local/loafers-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 150, soldCount: 0, allowBackorder: true },
                        },
                        {
                            id: 'afinju-signature-agbada-set',
                            name: 'AFINJU Signature Agbada Set',
                            slug: 'afinju-signature-agbada-set',
                            description: 'A luxurious three-piece Agbada set crafted from premium Aso-Oke fabric, featuring intricate hand-embroidery.',
                            features: ['Premium Aso-Oke fabric', 'Hand-embroidered details', 'Tailored fit', 'Breathable and comfortable'],
                            items: ['Agbada (Outer Robe)', 'Buba (Inner Shirt)', 'Sokoto (Trousers)'],
                            price: 350000,
                            compareAtPrice: 400000,
                            currency: 'NGN',
                            colors: ['Blue', 'Black', 'Brown'],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1540224871915-bc8ffb782bdf?w=1200&q=90', alt: 'Agbada Hero', publicId: 'local/agbada-hero' },
                                { url: 'https://images.unsplash.com/photo-1512408389658-0ce8a4be0178?w=1200&q=90', alt: 'Agbada Detail', publicId: 'local/agbada-detail' },
                                { url: 'https://images.unsplash.com/photo-1540224871915-bc8ffb782bdf?w=1200&q=90', alt: 'Agbada Lifestyle', publicId: 'local/agbada-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 30, soldCount: 0, allowBackorder: false },
                        },
                        {
                            id: 'afinju-leather-mules',
                            name: 'AFINJU Classic Leather Mules',
                            slug: 'afinju-classic-leather-mules',
                            description: 'Elegant backless leather mules, perfect for both traditional and smart-casual attire. Easy slip-on design with a sophisticated profile.',
                            features: ['Genuine leather construction', 'Backless slip-on design', 'Low stacked heel', 'Durable outsole'],
                            items: ['Pair of Mules', 'Storage Bag'],
                            price: 850000,
                            compareAtPrice: 100000,
                            currency: 'NGN',
                            colors: ['Black', 'Brown', 'Blue'],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&q=90', alt: 'Mules Hero', publicId: 'local/mules-hero' },
                                { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=90', alt: 'Mules Detail', publicId: 'local/mules-detail' },
                                { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&q=90', alt: 'Mules Lifestyle', publicId: 'local/mules-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 100, soldCount: 0, allowBackorder: true },
                        },
                        {
                            id: 'afinju-gobi-cap-collection',
                            name: 'AFINJU Premium Gobi Cap',
                            slug: 'afinju-premium-gobi-cap',
                            description: 'The quintessential Yoruba cap (Fila), handcrafted to perfection. A symbol of pride, culture, and undeniable style.',
                            features: ['Traditional Foldable Design', 'Hand-woven fabric', 'Structured base for shape retention', 'Available in multiple sizes'],
                            items: ['Gobi Cap', 'Protective Box'],
                            price: 45000,
                            compareAtPrice: 55000,
                            currency: 'NGN',
                            colors: ['Red', 'Blue', 'Black', 'Brown'],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cb3a?w=1200&q=90', alt: 'Cap Hero', publicId: 'local/cap-hero' },
                                { url: 'https://images.unsplash.com/photo-1588661706680-e3f421b8eb58?w=1200&q=90', alt: 'Cap Detail', publicId: 'local/cap-detail' },
                                { url: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cb3a?w=1200&q=90', alt: 'Cap Lifestyle', publicId: 'local/cap-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 500, soldCount: 0, allowBackorder: true },
                        },
                        {
                            id: 'afinju-signature-oil-perfume',
                            name: 'AFINJU Signature Oil Perfume',
                            slug: 'afinju-signature-oil-perfume',
                            description: 'A deep, masculine, and authoritative scent. Formulated as an oil to last 8-12 hours, leaving a memorable impression.',
                            features: ['Concentrated oil formulation', '8-12 hour longevity', 'Woody and spicy notes', 'Premium glass bottle'],
                            items: ['50ml Oil Perfume Bottle', 'Presentation Box'],
                            price: 75000,
                            compareAtPrice: 90000,
                            currency: 'NGN',
                            colors: [],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90', alt: 'Perfume Hero', publicId: 'local/perfume-hero' },
                                { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90', alt: 'Perfume Detail', publicId: 'local/perfume-detail' },
                                { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90', alt: 'Perfume Lifestyle', publicId: 'local/perfume-lifestyle' },
                            ],
                            inventory: { launchEditionLimit: 300, soldCount: 0, allowBackorder: true },
                        }
                    ];
                    _i = 0, products_1 = products;
                    _a.label = 1;
                case 1:
                    if (!(_i < products_1.length)) return [3 /*break*/, 4];
                    product = products_1[_i];
                    return [4 /*yield*/, db.collection('products').doc(product.id).set(__assign(__assign({}, product), { seo: {
                                title: "".concat(product.name, " | Premium Nigerian Craftsmanship"),
                                description: product.description,
                            }, status: 'active', createdAt: firestore_1.Timestamp.now(), updatedAt: firestore_1.Timestamp.now() }))];
                case 2:
                    _a.sent();
                    console.log('✅  Product created:', product.id);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('\n🚀  Seed complete. Added 10 products.\n');
                    return [2 /*return*/];
            }
        });
    });
}
seedMore().catch(function (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});

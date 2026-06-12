/** Niche presets used to make mock data feel brand-appropriate. */
export interface Niche {
  productNouns: string[];
  keywordSeeds: string[];
  categories: string[];
}

export const NICHES: Record<string, Niche> = {
  supplements: {
    productNouns: ["protein powder", "creatine", "multivitamin", "omega-3", "magnesium"],
    keywordSeeds: ["protein powder", "creatine monohydrate", "vitamin d3", "fish oil", "magnesium glycinate", "pre workout"],
    categories: ["Health & Household", "Sports Nutrition"],
  },
  kitchen: {
    productNouns: ["chef knife", "cutting board", "cookware set", "spatula", "mixing bowl"],
    keywordSeeds: ["chef knife", "cutting board", "nonstick pan", "kitchen utensil set", "mixing bowls", "knife set"],
    categories: ["Home & Kitchen", "Kitchen & Dining"],
  },
  beauty: {
    productNouns: ["vitamin c serum", "retinol cream", "face moisturizer", "hyaluronic serum", "eye cream"],
    keywordSeeds: ["vitamin c serum", "retinol", "hyaluronic acid", "face moisturizer", "eye cream", "niacinamide"],
    categories: ["Beauty & Personal Care", "Skin Care"],
  },
  pet: {
    productNouns: ["dog chew toy", "cat litter", "pet brush", "dog treats", "cat tree"],
    keywordSeeds: ["dog toys", "cat litter", "dog treats", "pet brush", "cat scratching post", "dog bed"],
    categories: ["Pet Supplies"],
  },
  outdoor: {
    productNouns: ["camping tent", "hiking backpack", "water bottle", "sleeping bag", "trekking poles"],
    keywordSeeds: ["camping tent", "hiking backpack", "insulated water bottle", "sleeping bag", "trekking poles", "headlamp"],
    categories: ["Sports & Outdoors", "Camping & Hiking"],
  },
};

export const NICHE_KEYS = Object.keys(NICHES);

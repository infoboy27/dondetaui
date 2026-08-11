export interface StoreDto {
  id: string
  slug: string
  name: string
  abbr: string
  color: string
  websiteUrl: string | null
  logoUrl: string | null
  productCount: number
}

// A physical branch location (stores table) -- distinct from StoreDto, which
// represents the retailer/chain (retailers table). A retailer has many
// branches; "nearby stores" means nearby branches, not nearby chains.
export interface StoreBranchDto {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  retailer: {
    slug: string
    name: string
    abbr: string
    color: string
  }
  distanceKm?: number
}

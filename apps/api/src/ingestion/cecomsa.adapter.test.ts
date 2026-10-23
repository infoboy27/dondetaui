import { describe, expect, it } from 'vitest'
import { CECOMSA_SEEDS, normalizeCecomsaItem, parseListing } from './cecomsa.adapter'

// Two cards copied from cecomsa.com/shop (Odoo eCommerce).
const LISTING = `<img itemprop="image" loading="lazy" class="img-fluid h-100 w-100 tp-product-image" src="//odoo-1f249.kxcdn.com/web/image/product.template/94973/image_512"/>
                    </a>
        <div class="d-flex flex-column position-absolute tp-action-buttons tp-action-buttons-rounded o_wsale_product_btn">
            <button type="button" role="button" class="btn btn-link p-0 tp-action-buttons-toggler d-lg-none ">
                <i class="fa fa-angle-down" role="img" aria-label="More options"></i>
            </button>
            <a href="#" role="button" aria-label="Carrito de compras" class="a-submit tp-action-toggle d-none">
                <i class="dri dri-cart"></i>
            </a>
            <button type="button" role="button" class="btn btn-link p-0 o_add_wishlist d-none d-lg-flex tp-action-toggle" title="Agregar a Lista de Deseos" data-action="o_wishlist" data-product-template-id="94973" data-product-product-id="104072">
                <i class="dri dri-wishlist" role="img" aria-label="Add to wishlist"></i>
            </button>
                <button type="button" role="button" class="d-none d-lg-flex btn btn-link p-0 o_add_compare" title="Agregar para Comparar" aria-label="Comparar" data-action="o_comparelist" data-product-product-id="104072"><span class="dri dri-compare"></span></button>
        </div>
                    <div class="tp-add-to-cart-btn o_wsale_product_btn d-none d-lg-block p-2">
                        <a href="#" role="button" class="a-submit btn btn-primary w-100 shadow-none rounded-pill" aria-label="Shopping cart">
                            <i class="dri dri-cart"></i> Agregar al carrito
                        </a>
                    </div>
                </div>
                <div class="tp-product-content p-3 text-center text-lg-start cecomsa-product-content">
                    <h6 class="mb-2 tp-product-title cecomsa-product-title">
                        <a class="tp-link-dark text-truncate d-block" itemprop="name" title="ABANICO DE TECHO NEXXT SMART NHA-F100 WITH RGB LIGHT (MM107NXT72)" href="/shop/aba363-abanico-de-techo-nexxt-smart-nha-f100-with-rgb-light-mm107nxt72-94973" content="ABANICO DE TECHO NEXXT SMART NHA-F100 WITH RGB LIGHT (MM107NXT72)">ABANICO DE TECHO NEXXT SMART NHA-F100 WITH RGB LIGHT (MM107NXT72)</a>
                    </h6>
                        <span class="text-muted small d-block cecomsa-product-code" itemprop="sku" data-variant-id="104072">
                            CÓDIGO: ABA363
                        </span>
                        <div class="d-flex flex-column align-items-center position-relative">
                        <div class="cecomsa-price-wrapper w-100">
        <div itemprop="offers" itemscope="itemscope" itemtype="http://schema.org/Offer" class="product_price me-2">
            <span class="h6 text-primary mb-0" data-oe-type="monetary" data-oe-expression="template_price_vals[&#39;price_reduce&#39;]">RD$ <span class="oe_currency_value">3,693.40</span></span>
            <span itemprop="price" style="display:none;">3693.4</span>
            <span itemprop="priceCurrency" style="display:none;">DOP</span>
        </div>
                        </div>
                        <div class="d-flex flex-row justify-content-between align-items-center gap-2 w-100 cecomsa-itbis-variants-wrapper">
                            <div class="cecomsa-itbis-text">(ITBIS INCLUIDO)</div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
                                        </div><div class="col tp-product-item tp-product-item-grid-3" data-product-template-id="77678">
        <form action="/shop/cart/update" method="post" itemscope="itemscope" itemtype="http://schema.org/Product" class="h-100 bg-white" data-publish="on">
            <input name="product_id" type="hidden" value="86569"/>
            <input type="hidden" name="csrf_token" value="8eac75eb92120dc94f8426b4fce42b17661d9732o1824233231"/>
            
            
            
            <div class="tp-product-wrapper border overflow-hidden tp-rounded-border-radius h-100 cecomsa-product-card">
                <div class="tp-product-top position-relative overflow-hidden">
                    <a class="tp-product-image-container d-block" itemprop="url" href="/shop/acc156-acces-point-tp-link-ax1800-eap610-indoor-outdoor-wi-fi-6-nw002tpl25-77678">
                        <img itemprop="image" loading="lazy" class="img-fluid h-100 w-100 tp-product-image" src="//odoo-1f249.kxcdn.com/web/image/product.template/77678/image_512"/>
                    </a>
        <div class="d-flex flex-column position-absolute tp-action-buttons tp-action-buttons-rounded o_wsale_product_btn">
            <button type="button" role="button" class="btn btn-link p-0 tp-action-buttons-toggler d-lg-none ">
                <i class="fa fa-angle-down" role="img" aria-label="More options"></i>
            </button>
            <a href="#" role="button" aria-label="Carrito de compras" class="a-submit tp-action-toggle d-none">
                <i class="dri dri-cart"></i>
            </a>
            <button type="button" role="button" class="btn btn-link p-0 o_add_wishlist d-none d-lg-flex tp-action-toggle" title="Agregar a Lista de Deseos" data-action="o_wishlist" data-product-template-id="77678" data-product-product-id="86569">
                <i class="dri dri-wishlist" role="img" aria-label="Add to wishlist"></i>
            </button>
                <button type="button" role="button" class="d-none d-lg-flex btn btn-link p-0 o_add_compare" title="Agregar para Comparar" aria-label="Comparar" data-action="o_comparelist" data-product-product-id="86569"><span class="dri dri-compare"></span></button>
        </div>
                    <div class="tp-add-to-cart-btn o_wsale_product_btn d-none d-lg-block p-2">
                        <a href="#" role="button" class="a-submit btn btn-primary w-100 shadow-none rounded-pill" aria-label="Shopping cart">
                            <i class="dri dri-cart"></i> Agregar al carrito
                        </a>
                    </div>
                </div>
                <div class="tp-product-content p-3 text-center text-lg-start cecomsa-product-content">
                    <h6 class="mb-2 tp-product-title cecomsa-product-title">
                        <a class="tp-link-dark text-truncate d-block" itemprop="name" title="ACCES POINT TP-LINK AX1800 EAP610 INDOOR/OUTDOOR/WI-FI 6 (NW002TPL25)" href="/shop/acc156-acces-point-tp-link-ax1800-eap610-indoor-outdoor-wi-fi-6-nw002tpl25-77678" content="ACCES POINT TP-LINK AX1800 EAP610 INDOOR/OUTDOOR/WI-FI 6 (NW002TPL25)">ACCES POINT TP-LINK AX1800 EAP610 INDOOR/OUTDOOR/WI-FI 6 (NW002TPL25)</a>
                    </h6>
                        <span class="text-muted small d-block cecomsa-product-code" itemprop="sku" data-variant-id="86569">
                            CÓDIGO: ACC156
                        </span>
                        <div class="d-flex flex-column align-items-center position-relative">
                        <div class="cecomsa-price-wrapper w-100">
        <div itemprop="offers" itemscope="itemscope" itemtype="http://schema.org/Offer" class="product_price me-2">
            <span class="h6 text-primary mb-0" data-oe-type="monetary" data-oe-expression="template_price_vals[&#39;price_reduce&#39;]">RD$ <span class="oe_currency_value">9,723.20</span></span>
            <span itemprop="price" style="display:none;">9723.2</span>
            <span itemprop="priceCurrency" style="display:none;">DOP</span>
        </div>`

describe('parseListing', () => {
  const items = parseListing(LISTING)

  it('reads name, code, price, path and image of every card', () => {
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      name: 'ABANICO DE TECHO NEXXT SMART NHA-F100 WITH RGB LIGHT (MM107NXT72)',
      path: '/shop/aba363-abanico-de-techo-nexxt-smart-nha-f100-with-rgb-light-mm107nxt72-94973',
      code: 'ABA363',
      price: 3693.4,
      imageUrl: 'https://odoo-1f249.kxcdn.com/web/image/product.template/94973/image_512',
    })
  })

  it('decodes numeric HTML entities in names', () => {
    const html = LISTING.replace('NEXXT SMART', 'NEXXT 24&#34; SMART')
    expect(parseListing(html)[0]!.name).toContain('NEXXT 24" SMART')
  })

  it('ignores cards without a price', () => {
    expect(parseListing(LISTING.replace(/itemprop="price"/g, 'itemprop="x"'))).toEqual([])
  })
})

describe('normalizeCecomsaItem', () => {
  it('maps a card to a normalized item in the seed category', () => {
    const seed = CECOMSA_SEEDS.find(s => s.categorySlug === 'lavadoras')!
    const item = normalizeCecomsaItem(
      { name: 'LAVADORA SAMSUNG 20KG WA20R5 (WA20R5000)', path: '/shop/x-1', code: 'LAV1', price: 25000 },
      seed,
    )
    expect(item).toMatchObject({
      retailer: { slug: 'cecomsa' }, externalSku: 'LAV1', brand: 'Samsung', categoryName: 'Lavadoras',
      price: 25000, available: true, sourceUrl: 'https://www.cecomsa.com/shop/x-1',
    })
  })

  it('knows KTC and defaults unbranded names to it', () => {
    const seed = CECOMSA_SEEDS[0]!
    expect(normalizeCecomsaItem({ name: 'ESTUFA KTC 24" CON 4 QUEMADORES (24AMG4G001)', path: '/shop/a', code: 'KTC430', price: 14000 }, seed).brand).toBe('KTC')
    expect(normalizeCecomsaItem({ name: 'ACONDICIONADOR DE AIRE SPLIT INVERTER SEER20 24000BTU (CEAG15-24CRFN1-R32)', path: '/shop/b', code: 'AIRE30', price: 30000 }, seed).brand).toBe('KTC')
    expect(normalizeCecomsaItem({ name: 'LAVADORA LG 18KG (WT18)', path: '/shop/c', code: 'LAV2', price: 30000 }, seed).brand).toBe('LG')
  })

  it('falls back to the internal code when the name has no model', () => {
    const item = normalizeCecomsaItem({ name: 'Abanico de pedestal', path: '/shop/y-2', code: 'ABA9', price: 900 }, CECOMSA_SEEDS[0]!)
    expect(item.model).toBe('ABA9')
    expect(item.brand).toBe('KTC')
  })
})

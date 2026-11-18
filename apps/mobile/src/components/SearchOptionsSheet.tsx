import { useMemo, useState } from 'react'
import { Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Product } from '../types'
import {
  NO_FILTERS,
  SORT_KEYS,
  SORT_LABELS,
  applySearchOptions,
  parsePriceInput,
  searchFacets,
  type Facet,
  type SearchFilters,
  type SortKey,
} from '../domain/searchOptions'
import { formatCount } from '../domain/currency'
import { getCountry } from '../domain/currentCountry'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import { haptics } from '../design/haptics'
import Icon from './Icon'
import Button from './ui/Button'
import Touchable from './ui/Touchable'

// "Ordenar y filtrar" for search results, as a native page sheet. Changes
// apply live (the list behind updates); the footer says how many remain.
const COLLAPSED = 6

export default function SearchOptionsSheet({
  visible,
  onClose,
  results,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
}: {
  visible: boolean
  onClose: () => void
  results: Product[]
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}) {
  const facets = useMemo(() => searchFacets(results), [results])
  const shown = useMemo(() => applySearchOptions(results, sort, filters).length, [results, sort, filters])
  const toggle = (key: 'stores' | 'categories' | 'brands', value: string) => {
    haptics.selection()
    const selected = filters[key]
    onFiltersChange({ ...filters, [key]: selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value] })
  }
  const symbol = getCountry().currencySymbol

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.screen} edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}>
        <View style={styles.navBar}>
          <Touchable
            onPress={() => { onSortChange('relevance'); onFiltersChange(NO_FILTERS) }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Restablecer orden y filtros"
          >
            <Text style={[type.body, styles.navAction]}>Restablecer</Text>
          </Touchable>
          <Text style={[type.headline, styles.navTitle]}>Ordenar y filtrar</Text>
          <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Listo">
            <Text style={[type.headline, styles.navAction]}>Listo</Text>
          </Touchable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Section title="Ordenar por">
            {SORT_KEYS.map(key => (
              <CheckRow
                key={key}
                title={SORT_LABELS[key]}
                checked={sort === key}
                onPress={() => { haptics.selection(); onSortChange(key) }}
              />
            ))}
          </Section>

          <Section title="Precio">
            <View style={styles.priceRow}>
              <PriceInput
                label="Mínimo"
                symbol={symbol}
                value={filters.minPrice}
                onChange={minPrice => onFiltersChange({ ...filters, minPrice })}
              />
              <Text style={[type.body, styles.dash]}>–</Text>
              <PriceInput
                label="Máximo"
                symbol={symbol}
                value={filters.maxPrice}
                onChange={maxPrice => onFiltersChange({ ...filters, maxPrice })}
              />
            </View>
          </Section>

          <Section title="Disponibilidad">
            <SwitchRow
              title="Solo en existencia"
              value={filters.onlyAvailable}
              onChange={onlyAvailable => onFiltersChange({ ...filters, onlyAvailable })}
            />
            <SwitchRow
              title="Solo con descuento"
              value={filters.onlyDeals}
              onChange={onlyDeals => onFiltersChange({ ...filters, onlyDeals })}
            />
          </Section>

          <FacetSection title="Tiendas" facets={facets.stores} selected={filters.stores} onToggle={value => toggle('stores', value)} />
          <FacetSection title="Categorías" facets={facets.categories} selected={filters.categories} onToggle={value => toggle('categories', value)} />
          <FacetSection title="Marcas" facets={facets.brands} selected={filters.brands} onToggle={value => toggle('brands', value)} />
        </ScrollView>

        <View style={styles.footer}>
          <Button title={shown === 1 ? 'Ver 1 resultado' : `Ver ${formatCount(shown)} resultados`} onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const rows = (Array.isArray(children) ? children : [children]).flat().filter(Boolean)
  return (
    <View style={styles.section}>
      <Text style={[type.footnote, styles.sectionTitle]}>{title.toUpperCase()}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={index}>
            {row}
            {index < rows.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  )
}

function CheckRow({ title, detail, checked, onPress }: { title: string; detail?: string; checked: boolean; onPress: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityState={{ selected: checked }}
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
    >
      <Text style={[type.body, styles.rowTitle]} numberOfLines={1}>{title}</Text>
      {!!detail && <Text style={[type.subheadline, styles.rowDetail]}>{detail}</Text>}
      <View style={styles.check}>{checked && <Icon name="checkmark" size={16} color={colors.primaryDark} weight="semibold" />}</View>
    </Touchable>
  )
}

function SwitchRow({ title, value, onChange }: { title: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, styles.rowTitle]} numberOfLines={1}>{title}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} accessibilityLabel={title} />
    </View>
  )
}

function FacetSection({ title, facets, selected, onToggle }: { title: string; facets: Facet[]; selected: string[]; onToggle: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  if (facets.length < 2 && !selected.length) return null
  // Selected values stay visible even when the list is collapsed.
  const visible = expanded ? facets : facets.filter((facet, index) => index < COLLAPSED || selected.includes(facet.value))
  const hidden = facets.length - visible.length
  return (
    <Section title={title}>
      {visible.map(facet => (
        <CheckRow
          key={facet.value}
          title={facet.value}
          detail={formatCount(facet.count)}
          checked={selected.includes(facet.value)}
          onPress={() => onToggle(facet.value)}
        />
      ))}
      {hidden > 0 && (
        <Touchable onPress={() => setExpanded(true)} style={styles.row} accessibilityRole="button" accessibilityLabel={`Ver ${hidden} ${title.toLowerCase()} más`}>
          <Text style={[type.body, styles.more]}>Ver {formatCount(hidden)} más</Text>
          <Icon name="chevronDown" size={13} color={colors.primaryDark} weight="semibold" />
        </Touchable>
      )}
    </Section>
  )
}

function PriceInput({ label, symbol, value, onChange }: { label: string; symbol: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <View style={styles.priceField}>
      <Text style={[type.caption, styles.priceLabel]}>{label}</Text>
      <View style={styles.priceInputRow}>
        <Text style={[type.body, styles.priceSymbol]}>{symbol}</Text>
        <TextInput
          value={value === null ? '' : formatCount(value)}
          onChangeText={text => onChange(parsePriceInput(text))}
          keyboardType="number-pad"
          placeholder="Cualquiera"
          placeholderTextColor={colors.tertiaryLabel}
          style={[type.body, styles.priceInput]}
          accessibilityLabel={`Precio ${label.toLowerCase()}`}
          returnKeyType="done"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56,
  },
  navTitle: { color: colors.navy },
  navAction: { color: colors.primaryDark },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.secondaryLabel, marginLeft: spacing.lg, marginBottom: 6 },
  card: { backgroundColor: colors.card, borderRadius: radii.md, borderCurve: 'continuous', overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.lg },
  rowTitle: { flex: 1, color: colors.navy },
  rowDetail: { color: colors.tertiaryLabel },
  check: { width: 18, alignItems: 'center' },
  more: { flex: 1, color: colors.primaryDark },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  dash: { color: colors.tertiaryLabel },
  priceField: { flex: 1, backgroundColor: colors.fill, borderRadius: radii.sm, borderCurve: 'continuous', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  priceLabel: { color: colors.secondaryLabel },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceSymbol: { color: colors.secondaryLabel },
  priceInput: { flex: 1, color: colors.navy, paddingVertical: 2 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.background },
})

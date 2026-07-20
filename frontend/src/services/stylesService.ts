import { StyleCatalog, StyleOption } from '../models/domain';
import { fetchJson } from './apiClient';
import type { CatalogsResponseDto, StylesResponseDto } from '../types/dto';

export async function getCatalogs(): Promise<StyleCatalog[]> {
  const payload = await fetchJson<CatalogsResponseDto>('/styles/catalogs');
  return (payload.catalogs || []).map(StyleCatalog.fromDto);
}

export async function getStylesByCatalog(catalogId: string): Promise<StyleOption[]> {
  const payload = await fetchJson<StylesResponseDto>(`/styles?catalog=${encodeURIComponent(catalogId)}`);
  return (payload.styles || []).map(StyleOption.fromDto);
}

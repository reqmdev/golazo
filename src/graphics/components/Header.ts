import { AppHeader } from './AppHeader';
import type { Theme } from '../core/types';

/** @deprecated Use AppHeader — kept for import compatibility. */
export function Header(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  badge?: string;
  theme: Theme;
}) {
  return AppHeader({ ...props });
}
/**
 * Keyboard focus and mouse hover for the browser version. Phones have no hover,
 * and the phone's own screen reader draws its own focus, so this is web only
 * (the bundler picks this file on web and web-states.ts everywhere else).
 *
 * Doing this once here means every button, tile and link gets the same visible
 * focus ring without each component tracking it.
 */
import { colors } from './colors';

const CSS = `
  [role="button"]:focus-visible,
  [role="radio"]:focus-visible,
  [role="link"]:focus-visible,
  [role="tab"]:focus-visible,
  [role="imagebutton"]:focus-visible,
  a:focus-visible {
    outline: 2px solid ${colors.borderStrong} !important;
    outline-offset: 2px;
  }
  input:focus-visible { outline: none !important; }
  @media (hover: hover) {
    [role="button"]:not([aria-disabled="true"]):hover,
    [role="radio"]:hover,
    a:hover { filter: brightness(0.97); }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}

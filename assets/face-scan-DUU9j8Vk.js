import { r as c } from './shell-DuKJJrzf.js';

export const FaceScanView = {
  async render({ root }) {
    root.append(
      c('div', { class: 'panel' }, [
        c('h2', { text: 'Facescan Lab' }),
        c('p', { class: 'muted', text: 'Search a name or add your own photos. The recovered photo-to-head tool builds a 2K head in this page; photos are processed in the browser and the full fine-tune and scan controls are below.' }),
        c('iframe', {
          class: 'face-tool-frame',
          src: '/face-scan/tool.html?embed=1',
          title: 'Facescan Lab: photo-to-head builder and fine-tune controls',
          loading: 'eager',
          style: 'width:100%;height:1500px;border:0;border-radius:12px;background:#0e1116',
        }),
        c('p', { class: 'muted' }, [
          'If the embedded tool is blocked by your browser, ',
          c('a', { href: '/face-scan/tool.html', target: '_blank', rel: 'noopener' }, 'open the Facescan Lab in its own tab'),
          '. The recovered public tool includes the reference cloud community links; the photo-to-head builder itself runs locally.',
        ]),
      ]),
      c('p', { class: 'muted', text: 'Desktop-shell guard: in the native app build this tab is removed at runtime (`/FreeBuilderApp/` user-agent test), matching the original behaviour.' }),
    );
  },
};

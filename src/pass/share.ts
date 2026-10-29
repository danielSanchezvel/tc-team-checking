import { toPng } from 'html-to-image';

function slug(s: string): string {
  return (s || 'tc-team')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function download(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Genera un PNG del nodo del pasabordo y lo comparte por la Web Share API
 * (en el celular abre el share sheet → WhatsApp). Si no hay Web Share con
 * archivos, cae a descarga. El nodo solo contiene datos públicos (§3.4, §8.7).
 */
export async function sharePass(node: HTMLElement, alias: string): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#12041F',
  });

  const filename = `pasabordo-${slug(alias)}.png`;

  let file: File | null = null;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    file = new File([blob], filename, { type: 'image/png' });
  } catch {
    file = null;
  }

  const nav = navigator as Navigator & {
    canShare?: (d?: ShareData) => boolean;
  };

  if (file && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: 'Mi pasabordo · TC Team',
        text: '¡Hice check-in! ✈️🍯 CLO → PUJ',
      });
      return;
    } catch {
      // el usuario canceló o el share falló: caemos a descarga
    }
  }

  download(dataUrl, filename);
}

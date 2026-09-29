export async function shareLink(url = location.href) {
  const data = { title: document.title, url };
  if (navigator.share) return navigator.share(data).then(() => 'shared', () => 'closed'); // fechar a folha também rejeita
  const copied = await navigator.clipboard?.writeText(url).then(() => true, () => false);
  if (copied) return 'copied';
  prompt('Copie o link:', url);
  return 'prompted';
}

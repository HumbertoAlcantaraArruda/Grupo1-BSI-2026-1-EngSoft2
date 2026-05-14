/**
 * PageLoader — Carregamento de views sem reload da página.
 *
 * Intercepta a navegação da sidebar: busca o HTML da view via fetch(),
 * extrai apenas o #page-content e injeta no shell atual.
 * A sidebar, topbar e scripts globais nunca são recarregados.
 */
const PageLoader = {

  async load(relativePath) {
    const url      = `${Router.BASE}/${relativePath}`;
    const $content = $('#page-content');

    $content.addClass('page-loading');

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const doc  = new DOMParser().parseFromString(html, 'text/html');

      // Suporta id="page-content" e class="page-content" (compatível com todas as views)
      const newContent = doc.getElementById('page-content')
                      || doc.querySelector('main.page-content');
      const pageTitle  = (doc.getElementById('page-title')
                      || doc.querySelector('.page-title'))?.textContent?.trim();
      const breadcrumb = (doc.getElementById('page-breadcrumb')
                      || doc.querySelector('.page-breadcrumb'))?.textContent?.trim();

      // Remove estilos injetados pela página anterior
      document.querySelectorAll('style[data-page-loader]').forEach(s => s.remove());

      // Injeta os <style> do <head> da nova página
      doc.querySelectorAll('head style').forEach(style => {
        const clone = document.createElement('style');
        clone.setAttribute('data-page-loader', '');
        clone.textContent = style.textContent;
        document.head.appendChild(clone);
      });

      $content.html(newContent?.innerHTML ?? '<p class="text-muted p-3">Página sem conteúdo.</p>');

      if (pageTitle)  $('#page-title').text(pageTitle);
      if (breadcrumb) $('#page-breadcrumb').text(breadcrumb);
      if (doc.title)  document.title = doc.title;

      // Atualiza URL sem recarregar
      history.pushState({ path: relativePath }, doc.title ?? '', url);

      // Scroll ao topo do conteúdo
      $content.get(0)?.scrollTo({ top: 0 });

    } catch (err) {
      Toast.getInstance().error('Erro ao carregar', 'Não foi possível carregar a página solicitada.');
      console.error('[PageLoader]', err);
    } finally {
      $content.removeClass('page-loading');
    }
  },

  // Atualiza o item ativo na sidebar sem re-renderizar o menu
  setActive(relativePath) {
    $('.sidebar-item, .sidebar-subitem').removeClass('active').removeAttr('aria-current');
    $('.sidebar-item-parent').removeClass('has-active');

    const $active = $(`.sidebar-item[href$="${relativePath}"], .sidebar-subitem[href$="${relativePath}"]`);
    $active.addClass('active').attr('aria-current', 'page');

    // Expande o submenu pai, se houver
    const $parent = $active.closest('.sidebar-submenu');
    if ($parent.length) {
      $parent.addClass('show');
      $parent.prev('.sidebar-item-parent').addClass('has-active').attr('aria-expanded', true);
    }
  }
};

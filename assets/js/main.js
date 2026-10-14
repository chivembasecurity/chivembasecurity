(function(){
  'use strict';

  const header=document.getElementById('cabecalho'), toggle=document.getElementById('menuToggle'), nav=document.getElementById('siteNav');
  const main=document.getElementById('conteudo');
  const form=document.getElementById('contact-form'), msg=document.getElementById('form-message'), submit=document.getElementById('submit-btn');
  const year=document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();

  function closeMenu(){if(!nav||!toggle)return;nav.classList.remove('open');toggle.classList.remove('active');toggle.setAttribute('aria-expanded','false');}
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.classList.toggle('active',open);toggle.setAttribute('aria-expanded',String(open));});
  window.addEventListener('scroll',()=>header?.classList.toggle('scrolled',window.scrollY>20),{passive:true});

  /* Router SPA por hash: todas as áreas continuam navegáveis sem recarregar a página. */
  const pageSections = main ? Array.from(main.children).filter(el=>el.dataset && el.dataset.page) : [];
  const navLinks = document.querySelectorAll('[data-page-link]');
  let currentPage = null;

  function setActiveNav(pageKey){ navLinks.forEach(a=>a.classList.toggle('active',a.dataset.pageLink===pageKey)); }
  function pageForId(id){ const el=document.getElementById(id); if(el?.dataset?.page)return el.dataset.page; const owner=el?.closest('[data-page]'); return owner?.dataset?.page||null; }
  function renderPage(pageKey,scrollId,opts){
    opts=opts||{}; if(!main)return;
    const doSwitch=()=>{
      pageSections.forEach(el=>{el.style.display=el.dataset.page===pageKey?'':'none';});
      currentPage=pageKey; setActiveNav(pageKey);
      requestAnimationFrame(()=>{
        main.classList.remove('page-fade-out');
        const target=scrollId?document.getElementById(scrollId):null;
        if(target) target.scrollIntoView({behavior:opts.instant?'auto':'smooth',block:'start'}); else window.scrollTo({top:0,behavior:'auto'});
      });
    };
    if(opts.instant||currentPage===null){doSwitch();return;}
    main.classList.add('page-fade-out'); setTimeout(doSwitch,160);
  }
  function goTo(id,opts){ const pageKey=pageForId(id)||'home'; renderPage(pageKey,id,opts); if(location.hash!=='#'+id) history.pushState(null,'','#'+id); closeMenu(); }

  /* Contexto do formulário: links e botões levam para o contacto já com o pedido pré-preenchido. */
  function setSelect(id,value){ const el=document.getElementById(id); if(!el||!value)return; const exists=[...el.options].some(o=>o.value===value||o.text===value); if(exists) el.value=value; }
  function updateFormMode(){
    if(!form)return;
    const kind=document.getElementById('request-kind')?.value||'servico';
    const type=document.getElementById('form-type'), hint=document.getElementById('form-intent-hint'), message=document.getElementById('message');
    if(type) type.value=kind==='emprego'?'Recrutamento':kind==='informacao'?'Pedido de informação':'Pedido de proposta';
    form.querySelectorAll('[data-form-group]').forEach(group=>{
      const modes=(group.dataset.formGroup||'').split(',').map(x=>x.trim());
      const visible=modes.includes(kind); group.hidden=!visible;
      group.querySelectorAll('input,select,textarea').forEach(field=>{field.disabled=!visible;});
    });
    const whatsapp=form.querySelector('.whatsapp-inline-link');
    if(kind==='emprego'){
      if(hint)hint.textContent='Preencha os seus contactos, escolha a vaga e indique resumidamente a sua experiência.';
      if(message){message.placeholder='Fale sobre a sua experiência, formação e motivação para a vaga.';}
      if(whatsapp){whatsapp.textContent='Prefere mais rápido? Contacte-nos pelo WhatsApp →';whatsapp.href='https://wa.me/244950086933?text='+encodeURIComponent('Olá, gostaria de obter informações sobre oportunidades de emprego na Chivemba Security.');}
      const btn=document.getElementById('submit-btn'); if(btn)btn.textContent='Enviar candidatura';
    }else if(kind==='informacao'){
      if(hint)hint.textContent='Diga-nos que informação precisa ou qual documento pretende consultar.';
      if(message)message.placeholder='Indique a sua dúvida ou o documento pretendido.';
      if(whatsapp){whatsapp.textContent='Prefere mais rápido? Fale connosco no WhatsApp →';whatsapp.href='https://wa.me/244950086933?text='+encodeURIComponent('Olá, gostaria de solicitar uma informação à Chivemba Security.');}
      const btn=document.getElementById('submit-btn'); if(btn)btn.textContent='Enviar mensagem';
    }else{
      if(hint)hint.textContent='Indique os dados essenciais para prepararmos uma proposta adequada.';
      if(message)message.placeholder='Descreva brevemente o serviço ou o que pretende proteger.';
      if(whatsapp){whatsapp.textContent='Prefere mais rápido? Fale já no WhatsApp →';whatsapp.href='https://wa.me/244950086933?text='+encodeURIComponent('Olá, gostaria de solicitar uma proposta de segurança.');}
      const btn=document.getElementById('submit-btn'); if(btn)btn.textContent='Enviar pedido';
    }
  }
  document.getElementById('request-kind')?.addEventListener('change',updateFormMode);
  updateFormMode();

  function applyFormContext(ctx){
    if(!form)return;
    const type=document.getElementById('form-type'), requested=document.getElementById('requested-document'), message=document.getElementById('message');
    if(ctx.type && type) type.value=ctx.type;
    if(ctx.type==='Recrutamento') setSelect('request-kind','emprego');
    else if(ctx.type==='Pedido de documento') setSelect('request-kind','informacao');
    else if(ctx.type && ctx.type.toLowerCase().includes('proposta')) setSelect('request-kind','servico');
    if(ctx.document && requested) requested.value=ctx.document;
    if(ctx.clientType) setSelect('client_type',ctx.clientType);
    if(ctx.service) setSelect('service',ctx.service);
    if(ctx.job) setSelect('job-position',ctx.job);
    updateFormMode();
    if(ctx.message && message) message.value=ctx.message;
    if(ctx.job && message) message.value=`Pretendo candidatar-me à vaga de ${ctx.job}. Gostaria de enviar o meu perfil e receber informações sobre o processo de recrutamento.`;
    if(ctx.document && message) message.value=`Gostaria de solicitar informações/acesso ao documento: ${ctx.document}.`;
    form.scrollIntoView({behavior:'smooth',block:'start'});
    const focusTarget=document.getElementById('name'); setTimeout(()=>focusTarget?.focus(),450);
  }

  document.addEventListener('click',e=>{
    const scenario=e.target.closest('[data-b2b-scenario]');
    if(scenario){
      e.preventDefault();
      const client=scenario.dataset.b2bScenario, service=scenario.dataset.service, message=scenario.dataset.message;
      goTo('contacto');
      setTimeout(()=>applyFormContext({type:'Pedido de proposta B2B',clientType:client,service:service,message}),230);
      return;
    }
    const job=e.target.closest('.job-apply');
    if(job){
      e.preventDefault(); goTo('contacto'); setTimeout(()=>applyFormContext({type:'Recrutamento',job:job.dataset.job}),230); return;
    }
    const a=e.target.closest('a[href^="#"]');
    if(!a)return;
    const id=a.getAttribute('href').slice(1); if(!id||id==='conteudo'||!document.getElementById(id))return;
    e.preventDefault(); goTo(id);
    const ctx={};
    if(a.dataset.prefill){ctx.type='Pedido de proposta';ctx.service=a.dataset.service||'Pedido de proposta';ctx.clientType=a.dataset.clientType||'Empresa';ctx.message=a.dataset.message||'Pretendo solicitar uma proposta de segurança.';}
    if(a.dataset.career){ctx.type='Recrutamento';ctx.message='Pretendo candidatar-me a uma oportunidade na Chivemba Security. Gostaria de enviar o meu perfil e receber informações sobre o processo de recrutamento.';}
    if(a.dataset.document){ctx.type='Pedido de documento';ctx.document=a.dataset.document;}
    if(a.dataset.service){ctx.type='Pedido de proposta';ctx.service=a.dataset.service;ctx.message=a.dataset.message||`Pretendo obter informações e uma proposta para o serviço de ${a.dataset.service}.`;}
    if(Object.keys(ctx).length) setTimeout(()=>applyFormContext(ctx),230);
  });

  window.addEventListener('popstate',()=>{const id=(location.hash||'#inicio').slice(1); if(document.getElementById(id))renderPage(pageForId(id)||'home',id,{instant:true});});
  (function init(){const initialId=(location.hash||'').replace('#','')||'inicio';const validId=document.getElementById(initialId)?initialId:'inicio';renderPage(pageForId(validId)||'home',validId,{instant:true});})();

  /* Filtro de documentos */
  document.querySelectorAll('.doc-filter').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.doc-filter').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
    const f=btn.dataset.filter; document.querySelectorAll('.documents-grid article').forEach(card=>card.hidden=f!=='all'&&card.dataset.category!==f);
  }));

  function show(type,text){if(!msg)return;msg.innerHTML='';const box=document.createElement('div');box.className=type==='success'?'success-message':'error-message';box.textContent=text;msg.appendChild(box);}

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.checkValidity()){form.reportValidity();return;}
    const cfg=window.CHIVEMBA_EMAIL_CONFIG||{};
    const params=Object.fromEntries(new FormData(form).entries());
    submit.disabled=true;
    const originalText=submit.textContent;
    submit.textContent='A enviar...';
    show('success','A enviar o seu pedido...');
    try{
      if(!cfg.web3formsAccessKey) throw new Error('A chave de envio não está configurada.');
      const payload=new FormData(form);
      payload.append('access_key',cfg.web3formsAccessKey);
      payload.append('to',cfg.destinationEmail||'dg@chivemba-security.com');
      payload.append('subject',(params.form_type||params.service||'Pedido de informação')+' — Chivemba Security');
      payload.append('from_name','Website Chivemba Security');
      const response=await fetch('https://api.web3forms.com/submit',{method:'POST',body:payload});
      const data=await response.json();
      if(!response.ok||!data.success) throw new Error(data.message||'Não foi possível enviar o pedido.');
      show('success','Pedido enviado com sucesso. A Chivemba Security entrará em contacto consigo.');
      form.reset();
      updateFormMode();
      const docField=document.getElementById('requested-document');
      if(docField) docField.value='';
    }catch(err){
      console.error(err);
      show('error','Não foi possível enviar o pedido. Tente novamente ou contacte +244 950 086 933.');
    }finally{
      submit.disabled=false;
      submit.textContent=originalText||'Enviar pedido';
    }
  });

  /* Newsletter: abre o cliente de email com o interesse já identificado quando não há backend configurado. */
  document.getElementById('newsletter-form')?.addEventListener('submit',e=>{
    e.preventDefault(); const input=document.getElementById('newsletter-email'); const out=document.getElementById('newsletter-message');
    if(!input.checkValidity()){input.reportValidity();return;}
    const email=input.value.trim(); const body=`Olá, gostaria de demonstrar interesse em receber novidades e conteúdos da Chivemba Security.\n\nMeu email: ${email}`;
    window.location.href='mailto:dg@chivemba-security.com?subject='+encodeURIComponent('Interesse em novidades — Chivemba Security')+'&body='+encodeURIComponent(body);
    if(out) out.textContent='Pedido preparado no email do dispositivo.';
  });
})();

(() => {
  const one = selector => document.querySelector(selector);
  const hero = one(".cover");
  const stage = one(".stage");
  const planes = [...stage.querySelectorAll(".plane")].map(element => ({
    element, depth: Number(element.dataset.depth)
  }));
  const projects = one("#projects");
  const roles = one(".roles");
  const header = one("header");
  const progress = one(".progress");
  const links = [...document.querySelectorAll("nav a")];
  const sections = links.map(link => one(link.hash));
  const nodes = [...document.querySelectorAll(".nodes i")];
  const feature = one(".lead-project");
  const motion = one(".motion");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = value => Math.max(0, Math.min(1, value));
  let paused = preference.matches;
  let visible = false, layoutFrame = 0, cameraFrame = 0;
  let aimX = 0, aimY = 0, x = 0, y = 0, exit = 0;

  function compose() {
    for (const {element, depth} of planes) {
      const dx = paused ? 0 : x * depth;
      const dy = paused ? 0 : y * depth * .6 - exit * depth * 1.8;
      element.style.setProperty("--px", dx.toFixed(2) + "px");
      element.style.setProperty("--py", dy.toFixed(2) + "px");
    }
    stage.style.setProperty("--tilt-x", (paused ? 0 : x * 3.2).toFixed(2) + "deg");
    stage.style.setProperty("--tilt-y", (paused ? 0 : -y * 2.1).toFixed(2) + "deg");
  }
  function easeCamera() {
    cameraFrame = 0;
    x += (aimX - x) * .16;
    y += (aimY - y) * .16;
    compose();
    if (Math.abs(aimX-x) + Math.abs(aimY-y) > .001) requestCamera();
  }
  function requestCamera() {
    if (!cameraFrame && visible && !paused && !document.hidden) cameraFrame = requestAnimationFrame(easeCamera);
  }
  hero.addEventListener("pointermove", event => {
    if (paused) return;
    const rect = hero.getBoundingClientRect();
    aimX = 2 * clamp((event.clientX - rect.left) / rect.width) - 1;
    aimY = 2 * clamp((event.clientY - rect.top) / rect.height) - 1;
    requestCamera();
  }, { passive:true });
  function recenter() { aimX=0; aimY=0; requestCamera(); }
  hero.addEventListener("pointerleave", recenter);
  hero.addEventListener("pointercancel", recenter);
  hero.addEventListener("pointerup", event => { if(event.pointerType==="touch") recenter(); });
  function visibility() {
    stage.classList.toggle("on-screen", visible && !document.hidden && !paused);
    if(visible && !document.hidden) requestCamera();
    else { cancelAnimationFrame(cameraFrame); cameraFrame=0; }
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visibility();
  }).observe(hero);
  document.addEventListener("visibilitychange", visibility);

  function layout() {
    layoutFrame=0;
    const height=innerHeight;
    const heroBox=hero.getBoundingClientRect();
    exit=clamp(-heroBox.top / heroBox.height);
    if(visible || paused) compose();
    const featureBox=feature.getBoundingClientRect();
    const entry=clamp((height-projects.getBoundingClientRect().top)/(height*.65));
    projects.style.setProperty("--lift", (paused?0:22*(1-entry)).toFixed(2)+"px");
    projects.style.setProperty("--seam", paused?1:entry);
    const lit=paused?nodes.length:Math.ceil(nodes.length*clamp((height-featureBox.top)/(featureBox.height*.65+height*.2)));
    nodes.forEach((node,i)=>{node.style.opacity=i<lit?"1":".2";});
    const roleBox=roles.getBoundingClientRect();
    roles.style.setProperty("--read", paused?1:clamp((height*.65-roleBox.top)/roleBox.height));
    progress.style.transform="scaleX("+clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-height))+")";
    const marker=header.offsetHeight+height*.24;
    sections.forEach((section,i)=>{
      const bounds=section.getBoundingClientRect();
      if(bounds.top<=marker && bounds.bottom>marker)links[i].setAttribute("aria-current","location");
      else links[i].removeAttribute("aria-current");
    });
  }
  function queueLayout(){if(!layoutFrame) layoutFrame=requestAnimationFrame(layout);}
  function setPaused(value) {
    paused=value;
    if (paused) levelTitle();
    document.documentElement.classList.toggle("moving",!paused);
    motion.textContent=paused?"Resume motion":"Pause motion";
    if(paused){cancelAnimationFrame(cameraFrame);cameraFrame=0;aimX=aimY=x=y=0;}
    compose();visibility();queueLayout();
  }
  const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add("entered");reveals.unobserve(entry.target);}
  }),{threshold:.08});
  document.querySelectorAll(".below .reveal").forEach(el=>reveals.observe(el));
  const title = one(".wordmark");
  function levelTitle() {
    title.style.removeProperty("--rx");
    title.style.removeProperty("--ry");
  }
  title.addEventListener("pointermove", event => {
    if (paused || event.pointerType === "touch") return;
    const box = title.getBoundingClientRect();
    title.style.setProperty("--ry", ((clamp((event.clientX-box.left)/box.width)-.5)*11)+"deg");
    title.style.setProperty("--rx", ((.5-clamp((event.clientY-box.top)/box.height))*7)+"deg");
  });
  title.addEventListener("pointerleave", levelTitle);
  motion.hidden=false;
  motion.addEventListener("click",()=>setPaused(!paused));
  preference.addEventListener("change",event=>setPaused(event.matches));
  addEventListener("scroll",queueLayout,{passive:true});
  addEventListener("resize",queueLayout);
  new ResizeObserver(queueLayout).observe(document.body);
  setPaused(paused);
})();
(() => {
  const explorer = document.querySelector(".professional .expertise");
  const navigation = explorer.querySelector(".expert-nav");
  const buttons = [...navigation.querySelectorAll("button")];
  const panels = [...explorer.querySelectorAll(".expert-panel")];
  navigation.setAttribute("role", "tablist");
  navigation.setAttribute("aria-label", "Professional capability");
  function activate(index, focus) {
    buttons.forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
      panels[i].classList.toggle("switching", i === index);
    });
    if (focus) buttons[index].focus();
  }
  buttons.forEach((button, index) => {
    button.setAttribute("role", "tab");
    panels[index].setAttribute("role", "tabpanel");
    panels[index].tabIndex = 0;
    button.addEventListener("click", () => activate(index, false));
    button.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + buttons.length - 1) % buttons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activate(next, true);
      }
    });
  });
  activate(0, false);
})();

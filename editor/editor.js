(async() => {
  var _get = async n => await (await fetch(chrome.extension.getURL(n))).json();
  var command = _get('/source/command.json');
  var config = _get('/source/config.json');
  
  var com = {body: Object.assign({}, command),key: Object.keys(command)};
  var t = document.querySelector(config.textarea_selector);
  var w = document.createElement('div'), s = document.createElement('style');
  w.classList.add('wiki_ed_window');
  s.innerHTML = `.wiki_ed_window {background: #fafafa;border: solid #555;border-width: 4px 0;box-shadow: 0px 0px 3px #aaa;margin: 2em 0;min-height: 15em;min-width: 25em;padding: 1em;position: fixed;right: 1em;top: 10%;} .wiki_ed_window ul {padding: 0 0 0 1em;} .wiki_ed_window li {display: grid;grid-template-columns: 10em 1fr;} .wiki_ed_window li b {color: #aaa;} .wiki_ed_window li input:checked + b {color: #333;} .wiki_ed_button {background: #f0f0f0;border: solid #555;border-width: 3px 0;box-shadow: 0 0 3px #888;color: #888;cursor: pointer;display: block;font-size: .9rem;font-weight: bold;margin: .45em 0;padding: .5rem 2rem;text-align: center;transition: all .25s;} .wiki_ed_button:hover {background: transparent;border-color: #901;text-decoration: none;}`;
  t.insertAdjacentElement('beforebegin', w);
  document.head.appendChild(s);
  var f = e => {
    var t = e.target;
    var s = t.value.split('');
    var i = t.selectionStart,  i1 = i - 1, i2 = i, limit = 0;
    var _, bef = '', aft = '';
    while((_ = s[i1--]) && _ !== '\n') (bef = _ + bef, limit++);
    while((_ = s[i2++]) && _ !== '\n') (aft += _);
    var m = bef.match(/\[{2}([^\[\/]+?)$/);
    i1 += 4;
    m && (i1 += m.index);
    var d;
    if(m) {
      var _R = /\[{2}([^\/].*?)\]{2}/g;
      var _S = bef + aft;
      var _V;
      while((_V = _R.exec(_S))) ((_V.index <= limit && limit <= (_V.index + _V[0].length)) && (d = _V));
    }
    var cur = {};
    var n = d ? com.key.filter(k => {
      var _ = d[1].match(new RegExp('^' + k + '(.*?)$'));
      return _ && (cur[k] = (_[1].match(/(?:^| )\S+?\=".*?"/g) || []).map(v => {
        var _ = v.match(/(?:^| )(\S+?)\="(.*?)"/);
        return [_[1], _[2]];
      }));
    }) : [];
    var x = m && n.length !== 1 ? com.key.filter(k => k.match(new RegExp('^' + m[1]))) : [];
    n.length && (n = n.filter(k => (i - i1 - 1) < d[1].length));
    var opt = n.length == 1 && com.body[n[0]].option;
    opt = opt && Object.keys(opt).map(k => [k, ...opt[k]]).filter(v => !cur[n[0]].find(o => o[0] == v[0]));
    console.log( `"${bef}"`, `"${aft}"`, i1, i, x, cur, opt, e.type );
    w.innerHTML = '';
    if(n.length) {
      w._tagName = Object.keys(cur)[0]; 
      w.innerHTML = `<h1>${w._tagName}</h1>`;
      var ul = document.createElement('ul');
      w.appendChild(ul);
      var cond = [];
      var wrap = {
        bef: s.slice(0, i1).join(''),
        name: w._tagName,
        aft: s.slice(i1 + d[1].length).join(''),
        index: i1
      };

      var _f = e => {
        var _ = cond.filter(c => c.checked).map(c => ` ${c._name}="${c._text.value}"`);
        var body = wrap.name + _.join('');
        t.value = wrap.bef + body + wrap.aft;
        t.setSelectionRange(wrap.index, wrap.index + body.length);
        t.focus();
      }

      var lab = (e, x) => {
        var li = document.createElement('li');
        ul.appendChild(li);
        var lb = document.createElement('label');
        lb.innerHTML = `<b>${e[0]}</b>`;
        li.appendChild(lb);
        var ch = document.createElement('input');
        ch.type = 'checkbox';
        ch.checked = x;
        lb.insertAdjacentElement('afterbegin', ch);
        var tx = document.createElement('input');
        tx.type = 'text';
        li.appendChild(tx);
        tx.value = e[1];
        ch._name = e[0];
        ch._text = tx;
        cond.push(ch);

        ch.onchange = _f;
        tx.onchange = _f;
      };
      cur[w._tagName].forEach(e => lab(e, true));
      opt.forEach(e => lab(e, false));
    }
    else if(x.length) {
      x.forEach(n => {
        var a = document.createElement('a');
        a.classList.add('wiki_ed_button');
        a.innerHTML = n;
        w.appendChild(a);
        var o = com.body[n].option;
        var wrap = {
          bef: s.slice(0, i1).join(''),
          name: n,
          aft: s.slice(i).join(''),
          index: i1,
          option: Object.keys(o).filter(k => o[k][1]).map(k => ` ${k}="${o[k][0]}"`).join(''),
          inline: com.body[n].inline,
          noclose: com.body[n].noclose
        };
        a.onclick = e => {
          var body = wrap.name + wrap.option + ']]' + (wrap.inline ? '' : '\n');
          t.value = wrap.bef + body + (wrap.inline ? '' : '\n') + (wrap.noclose ? '' : (`[[/${wrap.name}]]` + (wrap.inline ? '' : '\n'))) + wrap.aft;
          var i = wrap.index + body.length;
          t.setSelectionRange(i, i);
          t.focus();
          w.innerHTML = '';
        }
      });
    }
    else {
      w.innerHTML = '';
    }
  };
  ['onkeyup', 'onkeydown', 'oninput', 'onclick'].forEach(e => (t[e] = f));
})();

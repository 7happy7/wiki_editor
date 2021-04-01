(async() => {
  var _jsonize = async (...fch) => await Promise.all(fch.map(f => f.json()));
  var _fetches = async (...dir) => await Promise.all(dir.map(d => fetch(chrome.extension.getURL(d))));
  var _getJSON = async (...dir) => await _jsonize(...(await _fetches(...dir)));
  
  var [command, config] = await _getJSON('/source/command.json', '/source/config.json');
  var com = {body: Object.assign({}, command),key: Object.keys(command)};
  
  /* ***** */
  var t = await new Promise(r => {
    var _f = () => {
      var _t = document.querySelector(config.textarea_selector);
      _t ? r(_t) : setTimeout(_f, 100);
    };
    _f();
  });
  
  var w = document.createElement('div'), s = document.createElement('style');
  w.classList.add('wiki_ed_window');
  s.innerHTML = config.style;
  t.insertAdjacentElement('beforebegin', w);
  document.head.appendChild(s);
  var f = e => {
    var t = e.target;
    var s = t.value.split('');
    var i = t.selectionStart,  i1 = i - 1, i2 = i, limit = 0;
    var _, bef = '', aft = '';
    while((_ = s[i1--]) && _ !== '\n') (bef = _ + bef, limit++);
    while((_ = s[i2++]) && _ !== '\n') (aft += _);
    var m = bef.match(/\[{2}([a-z0-9 ]*?)$/i);
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
      return _ && (cur[k] = (_[1].match(/(?:^| ?)(\S+?)(?:\="(.*?)"|(?: |$))/g) || []).map((v, i, a) => {

        var _ = v.match(/(?:^| ?)(\S+?)(?:\="(.*?)"|(?: |$))/);
        var _d = com.body[k];
        _d = _d && _d.option[_[1]];
        return [_[2] || _[2] == '' ? _[1] : null, _[2] || _[2] == '' ? _[2] : _[1], true, _d && _d[2]];
      }));
    }) : [];

    m && console.log(d, m);

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
        var _ = cond.filter(c => c.checked).map(c => c._name ? ` ${c._name}="${c._text.value}"` : ` ${c._text.value}`);
        var body = wrap.name + _.join('');
        t.value = wrap.bef + body + wrap.aft;
        t.setSelectionRange(wrap.index, wrap.index + body.length);
        t.focus();
      }

      var lab = (e, x) => {
        var li = document.createElement('li');
        ul.appendChild(li);

        var ch = document.createElement('input');
        ch.type = 'checkbox';
        ch.checked = x;

        if(e[0]) {
          var lb = document.createElement('label');
          lb.innerHTML = `<b>${e[0]}</b>`;
          li.appendChild(lb);
          lb.insertAdjacentElement('afterbegin', ch);
        }

        var tx = document.createElement('input');
        tx.type = 'text';
        li.appendChild(tx);

        if(e[0] && e[3]) {
          var dl = document.createElement('datalist');
          dl.id = `wiki_ed_datalist_${e[0]}`;
          ul.appendChild(dl);
          tx.setAttribute('list', dl.id);
          e[3].forEach(n => {
            var sg = document.createElement('option');
            sg.value = n;
            dl.appendChild(sg);
          });
        }
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
          t.value = wrap.bef + body + (wrap.inline ? '' : '\n') + (wrap.noclose ? '' : (`[[/${wrap.name.split(' ')[0]}]]` + (wrap.inline ? '' : '\n'))) + wrap.aft;
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

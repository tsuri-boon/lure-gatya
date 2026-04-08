/* =============================================
   egi-sink-checker / app.js
   ============================================= */
(function () {
  var selMaker  = document.getElementById('sel-maker');
  var selSeries = document.getElementById('sel-series');
  var selSize   = document.getElementById('sel-size');
  var selType   = document.getElementById('sel-type');
  var resultEl  = document.getElementById('checker-result');

  /* ---------- ユーティリティ ---------- */
  function unique(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function filtered(o) {
    o = o || {};
    var maker  = o.maker  !== undefined ? o.maker  : selMaker.value;
    var series = o.series !== undefined ? o.series : selSeries.value;
    var size   = o.size   !== undefined ? o.size   : selSize.value;
    return EGI_DATA.filter(function (d) {
      return (!maker  || d.maker  === maker)
          && (!series || d.series === series)
          && (!size   || d.size   === size);
    });
  }

  function populate(sel, values, placeholder) {
    sel.innerHTML = '<option value="">' + placeholder + '</option>';
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v; sel.appendChild(o);
    });
  }

  /* ---------- 沈下速度 → バー幅・ラベル ---------- */
  function sinkProfile(s) {
    if (s === null || s === undefined) return null;
    if (s <= 2.0) return { label:'ディープ（速）',   pct:12  };
    if (s <= 3.5) return { label:'ベーシック',       pct:35  };
    if (s <= 5.5) return { label:'シャロー',         pct:60  };
    if (s <= 8.0) return { label:'スーパーシャロー', pct:82  };
    return               { label:'超スロー',         pct:100 };
  }

  /* ---------- 表示 ---------- */
  function showPlaceholder() {
    resultEl.innerHTML =
      '<div class="checker-placeholder">' +
        'メーカーからシリーズ・号数・タイプの順に<br>選択してください' +
      '</div>';
  }

  function showResult() {
    var item = EGI_DATA.find(function (d) {
      return d.maker  === selMaker.value
          && d.series === selSeries.value
          && d.size   === selSize.value
          && d.type   === selType.value;
    });
    if (!item) return;

    var profile   = sinkProfile(item.sink_sec_per_m);
    var hasSpeed  = profile !== null;
    var sec10m    = hasSpeed ? (item.sink_sec_per_m * 10).toFixed(0) : '—';
    var speedDisp = hasSpeed ? item.sink_sec_per_m : '—';

    /* 沈下バー or「データなし」メッセージ */
    var sinkHtml;
    if (hasSpeed) {
      sinkHtml =
        '<div class="sink-section">' +
          '<div class="sink-label-row">' +
            '<span>DEEP ▶</span>' +
            '<span class="sink-label-center">' + profile.label + '</span>' +
            '<span>◀ SHALLOW</span>' +
          '</div>' +
          '<div class="sink-track">' +
            '<div class="sink-track-bg"></div>' +
            '<div class="sink-fill" style="width:' + profile.pct + '%"></div>' +
          '</div>' +
          '<div class="sink-note">右ほど沈下が遅い（シャロー向き）</div>' +
        '</div>';
    } else {
      sinkHtml =
        '<div class="sink-nodata">' +
          '沈下速度データなし（重さで号数選択の参考に）' +
        '</div>';
    }

    /* アフィリエイト表示：affiliate_urlにHTMLタグがそのまま入っているのでinnerHTMLで出力 */
    var affHtml = item.affiliate_url
      ? '<div class="affiliate-img-wrap">' + item.affiliate_url + '</div>'
      : '<div class="affiliate-btn no-link">アフィリエイトリンク未設定</div>';

    resultEl.innerHTML =
      '<div class="checker-result">' +
        '<div class="result-top">' +
          '<div class="result-name-block">' +
            '<div class="result-meta">' + item.maker + ' / ' + item.series + '</div>' +
            '<div class="result-name">' + item.size + '&nbsp;' + item.type + '</div>' +
          '</div>' +
          '<span class="result-badge">' + item.category + '</span>' +
        '</div>' +
        '<div class="result-metrics">' +
          '<div class="result-metric">' +
            '<div class="result-metric-label">Weight</div>' +
            '<div class="result-metric-value">' + item.weight_g + '<span class="result-metric-unit">g</span></div>' +
          '</div>' +
          '<div class="result-metric">' +
            '<div class="result-metric-label">Sink Speed</div>' +
            '<div class="result-metric-value">' + speedDisp + (hasSpeed ? '<span class="result-metric-unit">秒/m</span>' : '') + '</div>' +
          '</div>' +
          '<div class="result-metric">' +
            '<div class="result-metric-label">10m到達</div>' +
            '<div class="result-metric-value">' + sec10m + (hasSpeed ? '<span class="result-metric-unit">秒</span>' : '') + '</div>' +
          '</div>' +
        '</div>' +
        sinkHtml +
        affHtml +
      '</div>';
  }

  /* ---------- セレクターリセット ---------- */
  function resetFrom(stage) {
    if (stage <= 1) { populate(selSeries, [], '先にメーカーを選択'); selSeries.disabled = true; }
    if (stage <= 2) { populate(selSize,   [], '先にシリーズを選択'); selSize.disabled   = true; }
    if (stage <= 3) { populate(selType,   [], '先に号数を選択');     selType.disabled   = true; }
    if (stage <= 4) { showPlaceholder(); }
  }

  /* ---------- イベント ---------- */
  selMaker.addEventListener('change', function () {
    resetFrom(1);
    if (!selMaker.value) return;
    populate(selSeries,
      unique(filtered({ series:'', size:'' }).map(function (d) { return d.series; })),
      'シリーズを選択');
    selSeries.disabled = false;
  });

  selSeries.addEventListener('change', function () {
    resetFrom(2);
    if (!selSeries.value) return;
    populate(selSize,
      unique(filtered({ size:'' }).map(function (d) { return d.size; })),
      '号数を選択');
    selSize.disabled = false;
  });

  selSize.addEventListener('change', function () {
    resetFrom(3);
    if (!selSize.value) return;
    var types = unique(filtered().map(function (d) { return d.type; }));
    populate(selType, types, 'タイプを選択');
    selType.disabled = false;
    if (types.length === 1) { selType.value = types[0]; showResult(); }
  });

  selType.addEventListener('change', function () {
    if (!selType.value) { showPlaceholder(); return; }
    showResult();
  });

  /* ---------- 初期化 ---------- */
  populate(selMaker,
    unique(EGI_DATA.map(function (d) { return d.maker; })),
    '選択してください');
  showPlaceholder();
})();

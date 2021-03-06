var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var records = [];
document.addEventListener('DOMContentLoaded', function () {
    var _a;
    const { utils, View, ListViewItem, ListView, TextView } = webfx;
    webfx.injectWebfxCss();
    const listView = new ListView(document.getElementById('records'));
    const stat = new TextView(document.getElementById('stat'));
    const domHeader = document.getElementById('header');
    class RecordView extends ListViewItem {
        constructor(data) {
            super();
            this.data = data;
        }
        createDom() {
            return webfx.jsxFactory("div", { class: "record" },
                webfx.jsxFactory("div", { class: "record-col ctime" }, () => new Date(this.data.timestamp * 1000).toLocaleString()),
                webfx.jsxFactory("div", { class: "record-col sname" }, () => `${this.data.sname} (${this.data.sno})`),
                webfx.jsxFactory("div", { class: "record-col sphone" }, () => this.data.sphone),
                webfx.jsxFactory("div", { class: "record-col semail" }, () => this.data.semail),
                webfx.jsxFactory("div", { class: "record-col squestion1", update: (dom) => {
                        utils.toggleClass(dom, 'empty', !this.data.squestion1);
                    } }, () => this.data.squestion1),
                webfx.jsxFactory("div", { class: "record-col squestion2" }, () => this.data.squestion2));
        }
    }
    var fetching = false;
    var fetchAll = false;
    var end = false;
    var seq = 1;
    var total = 0;
    function getData(after) {
        return __awaiter(this, void 0, void 0, function* () {
            fetching = true;
            try {
                var resp = yield fetch('api/records'
                    + (after ? '?beforeTime=' + encodeURIComponent(after.time) + '&afterSno=' + encodeURIComponent(after.sno) : ''), { credentials: 'same-origin' });
                var obj = yield resp.json();
                obj.records.map(r => (Object.assign({ seq: seq++ }, r))).forEach(r => {
                    records.push(r);
                    listView.add(new RecordView(r));
                });
                if (obj.records.length == 0)
                    end = true;
                else if (fetchAll)
                    getNext();
                if (obj.total != null)
                    total = obj.total;
                stat.text = `记录数：${total} 已拉取：${records.length}`;
            }
            catch (e) {
                alert('拉取错误！\n' + e);
            }
            finally {
                fetching = false;
            }
        });
    }
    function getNext() {
        const last = records[records.length - 1];
        return getData(last ? { time: last.timestamp, sno: last.sno } : undefined);
    }
    window.addEventListener('scroll', (ev) => {
        domHeader.style.boxShadow = window.scrollY < 1 ? 'none' : '';
        if (!fetching && !end
            && window.scrollY + window.innerHeight >= document.body.scrollHeight - 300) {
            getNext();
        }
    });
    (_a = document.getElementById('btnFetchAll')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (ev) => {
        fetchAll = true;
        if (!fetching)
            getNext();
    });
    getNext();
});

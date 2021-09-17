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
    const { toggleClass, View, ListViewItem, ListView, TextView, ContextMenu, MenuItem } = webfx;
    webfx.injectWebfxCss();
    const listView = new ListView(document.getElementById('records'));
    // listView.selectionHelper.enabled = true;
    const stat = new TextView(document.getElementById('stat'));
    const domHeader = document.getElementById('header');
    class RecordView extends ListViewItem {
        constructor(data) {
            super();
            this.data = data;
        }
        createDom() {
            return webfx.jsxFactory("div", { class: "record", hidden: () => !!this.data.hidden },
                webfx.jsxFactory("div", { class: "record-col time" }, () => `(${this.data.id}) ${new Date(this.data.ctime * 1000).toLocaleString()}`),
                webfx.jsxFactory("div", { class: "record-col basic" }, () => `${this.data.student_name} (${this.data.student_id})`),
                webfx.jsxFactory("div", { class: "record-col sphone" }, () => this.data.qq),
                webfx.jsxFactory("div", { class: "record-col semail" }, () => this.data.email),
                webfx.jsxFactory("div", { class: "record-col q1" }, () => this.data.why_join),
                webfx.jsxFactory("div", { class: "record-col q2", update: (dom) => {
                        toggleClass(dom, 'empty', !this.data.self_intro);
                    } }, () => this.data.self_intro));
        }
        postCreateDom() {
            super.postCreateDom();
            // this.dom.addEventListener("contextmenu", (e) => {
            //     e.preventDefault();
            //     const m = new ContextMenu();
            //     m.add(new MenuItem({
            //         text: "隐藏"
            //     }))
            //     m.show(e);
            // })
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
                    + (after ? '?after=' + encodeURIComponent(after) : ''), { credentials: 'same-origin' });
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
                const hidden = records.filter(x => x.hidden).length;
                stat.text = `已拉取 ${records.length - hidden} (+ ${hidden} 已隐藏) / 共 ${total}`;
            }
            catch (e) {
                alert('拉取错误！\n' + e);
            }
            finally {
                fetching = false;
            }
            checkPositionForGetNext();
        });
    }
    function getNext() {
        const last = records[records.length - 1];
        return getData(last ? last.id : undefined);
    }
    function checkPositionForGetNext() {
        if (!fetching && !end
            && window.scrollY + window.innerHeight >= document.body.scrollHeight - 300) {
            getNext();
        }
    }
    window.addEventListener('scroll', (ev) => {
        domHeader.style.boxShadow = window.scrollY < 1 ? 'none' : '';
        checkPositionForGetNext();
    });
    (_a = document.getElementById('btnFetchAll')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (ev) => {
        fetchAll = true;
        if (!fetching)
            getNext();
    });
    getNext();
});

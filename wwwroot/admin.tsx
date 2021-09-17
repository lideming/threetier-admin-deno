
declare const webfx: typeof import("@yuuza/webfx");

interface SRecord {
    id: number;
    student_id: any;
    student_name: string;
    qq: string;
    email: string;
    why_join: string;
    self_intro: string;
    ctime: number;
    hidden: number;
}

var records: SRecord[] = [];

document.addEventListener('DOMContentLoaded', function () {
    const { toggleClass, View, ListViewItem, ListView, TextView, ContextMenu, MenuItem } = webfx;
    webfx.injectWebfxCss();

    const listView = new ListView<RecordView>(document.getElementById('records')!);
    // listView.selectionHelper.enabled = true;
    const stat = new TextView(document.getElementById('stat')!);

    const domHeader = document.getElementById('header')!;

    class RecordView extends ListViewItem {
        data: SRecord;
        constructor(data: SRecord) {
            super();
            this.data = data;
        }
        createDom() {
            return <div class="record" hidden={() => !!this.data.hidden}>
                <div class="record-col time">{() => `(${this.data.id}) ${new Date(this.data.ctime * 1000).toLocaleString()}`}</div>
                <div class="record-col basic">{() => `${this.data.student_name} (${this.data.student_id})`}</div>
                <div class="record-col sphone">{() => this.data.qq}</div>
                <div class="record-col semail">{() => this.data.email}</div>
                <div class="record-col q1">{() => this.data.why_join}</div>
                <div class="record-col q2"
                    update={(dom: HTMLDivElement) => {
                        toggleClass(dom, 'empty', !this.data.self_intro);
                    }}>
                    {() => this.data.self_intro}
                </div>
            </div>;
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

    async function getData(after?: number) {
        fetching = true;
        try {
            var resp = await fetch('api/records'
                + (after ? '?after=' + encodeURIComponent(after) : ''),
                { credentials: 'same-origin' }
            );
            var obj = await resp.json() as { records: SRecord[], total: number | null };
            obj.records.map(r => ({ seq: seq++, ...r })).forEach(r => {
                records.push(r);
                listView.add(new RecordView(r));
            });
            if (obj.records.length == 0) end = true;
            else if (fetchAll) getNext();
            if (obj.total != null) total = obj.total;
            const hidden = records.filter(x => x.hidden).length;
            stat.text = `已拉取 ${records.length - hidden} (+ ${hidden} 已隐藏) / 共 ${total}`;
        } catch (e) {
            alert('拉取错误！\n' + e);
        } finally {
            fetching = false;
        }
        checkPositionForGetNext();
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

    document.getElementById('btnFetchAll')?.addEventListener('click', (ev) => {
        fetchAll = true;
        if (!fetching) getNext();
    });

    getNext();
});

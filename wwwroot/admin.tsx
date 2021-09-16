
declare const webfx: typeof import("@yuuza/webfx");

interface SRecord {
    id: number;
    student_id: any;
    student_name: string;
    why_join: string;
    self_intro: string;
    ctime: number;
}

var records: SRecord[] = [];

document.addEventListener('DOMContentLoaded', function () {
    const { utils, View, ListViewItem, ListView, TextView } = webfx;
    webfx.injectWebfxCss();

    const listView = new ListView<RecordView>(document.getElementById('records')!);
    const stat = new TextView(document.getElementById('stat')!);

    const domHeader = document.getElementById('header')!;

    class RecordView extends ListViewItem {
        data: SRecord;
        constructor(data: SRecord) {
            super();
            this.data = data;
        }
        createDom() {
            return <div class="record">
                <div class="record-col time">{() => `(${this.data.id}) ${new Date(this.data.ctime * 1000).toLocaleString()}`}</div>
                <div class="record-col basic">{() => `${this.data.student_name} (${this.data.student_id})`}</div>
                {/* <div class="record-col sphone">{() => this.data.sphone}</div>
                <div class="record-col semail">{() => this.data.semail}</div> */}
                <div class="record-col q1">{() => this.data.why_join}</div>
                <div class="record-col q2"
                    update={(dom: HTMLDivElement) => {
                        utils.toggleClass(dom, 'empty', !this.data.self_intro);
                    }}>
                    {() => this.data.self_intro}
                </div>
            </div>;
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
            stat.text = `记录数：${total} 已拉取：${records.length}`;
        } catch (e) {
            alert('拉取错误！\n' + e);
        } finally {
            fetching = false;
        }
    }

    function getNext() {
        const last = records[records.length - 1];
        return getData(last ? last.id : undefined);
    }

    window.addEventListener('scroll', (ev) => {
        domHeader.style.boxShadow = window.scrollY < 1 ? 'none' : '';
        if (!fetching && !end
            && window.scrollY + window.innerHeight >= document.body.scrollHeight - 300) {
            getNext();
        }
    });

    document.getElementById('btnFetchAll')?.addEventListener('click', (ev) => {
        fetchAll = true;
        if (!fetching) getNext();
    });

    getNext();
});

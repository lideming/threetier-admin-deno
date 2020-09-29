
declare const webfx: typeof import("@yuuza/webfx");

interface SRecord {
    sname: string;
    sno: number;
    sphone: string;
    semail: string;
    squestion1: string;
    squestion2: string;
    timestamp: number;
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
            return {
                tag: 'div.record',
                child: [
                    // { tag: 'div.record-col.seq', text: () => (this.data as any).seq },
                    { tag: 'div.record-col.ctime', text: () => new Date(this.data.timestamp * 1000).toLocaleString() },
                    { tag: 'div.record-col.sname', text: () => `${this.data.sname}(${this.data.sno})` },
                    // { tag: 'div.record-col.sno', text: () => this.data.sno },
                    { tag: 'div.record-col.sphone', text: () => this.data.sphone },
                    { tag: 'div.record-col.semail', text: () => this.data.semail },
                    {
                        tag: 'div.record-col.squestion1', text: () => this.data.squestion1,
                        update: (dom: HTMLDivElement) => {
                            utils.toggleClass(dom, 'empty', !this.data.squestion1);
                        }
                    },
                    { tag: 'div.record-col.squestion2', text: () => this.data.squestion2 },
                ]
            }
        }
    }

    var fetching = false;
    var fetchAll = false;
    var end = false;
    var seq = 1;
    var total = 0;

    async function getData(after?: { time: number, sno: number }) {
        fetching = true;
        try {
            var resp = await fetch('api/records'
                + (after ? '?beforeTime=' + encodeURIComponent(after.time) + '&afterSno=' + encodeURIComponent(after.sno) : ''),
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
        return getData(last ? { time: last.timestamp, sno: last.sno } : undefined);
    }

    window.addEventListener('scroll', (ev) => {
        domHeader.style.boxShadow = window.scrollY == 0 ? 'none' : '';
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

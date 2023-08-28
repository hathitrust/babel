const DETAILS_CHUNK_SIZE = 25;

export class DetailsStateManager {

  constructor(options = {}) {
    this.root = options.root;
    this.openState = options.openState;
    this.pageSequenceChunks = [];
    this.detailsEls = [];
  }

  updateDetailsState(targetEl) {
    if ( this.detailsEls.length == 0 ) {
      this.detailsEls = [...this.root.querySelectorAll('details')];
      this.pageSequenceChunks = this.sliceIntoChunks(this.detailsEls.map((el) => el.dataset.seq), DETAILS_CHUNK_SIZE);
    }
    
    this.openState = ! this.openState;
    const currentSeq = targetEl.dataset.seq;
    const nearestChunk = this.pageSequenceChunks.find((chunk) => chunk.indexOf(currentSeq) >= 0);
    this.processChunk(nearestChunk);

    this.pageSequenceChunks.forEach((chunk) => {
      if ( chunk.indexOf(currentSeq) >= 0 ) { return ; }
      setTimeout(() => {
        this.processChunk(chunk);
      });
    })
  }

  processChunk(chunk) {
    chunk.forEach((seq) => {
      this.detailsEls[seq - 1].open = this.openState;
    })
  }

  sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
  }
}

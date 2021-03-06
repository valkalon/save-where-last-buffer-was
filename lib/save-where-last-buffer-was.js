'use babel';

import SaveWhereLastBufferWasView from './save-where-last-buffer-was-view';
import { CompositeDisposable } from 'atom';

export default {
  // We call "titled buffer" a buffer which is already saved on disk

  currentBufferPath: undefined, // Path of the current buffer
  lastTitledBufferPath: undefined, // Path of the last titled buffer
  textEditor: undefined, // the current textEditor
  saveWhereLastBufferWasView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.saveWhereLastBufferWasView = new SaveWhereLastBufferWasView(state.saveWhereLastBufferWasViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.saveWhereLastBufferWasView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // we live update our buffer paths
    const activePaneObserver = atom.workspace.observeActivePaneItem(textEditor => {
      textEditor = textEditor || {}
      this.textEditor = textEditor
      if (typeof this.textEditor.getPath === 'function' ) {
        this.currentBufferPath = this.textEditor.getPath()
        if (this.currentBufferPath !== undefined) {
          this.lastTitledBufferPath = this.currentBufferPath
        }
      }

      if (typeof this.textEditor.onDidSave === 'function') {
        this.textEditor.onDidSave((event) => {
          this.currentBufferPath = event.path
        })
      }

    })

    this.subscriptions.add(activePaneObserver)
    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'save-where-last-buffer-was:toggle': () => this.toggle(),
      'save-where-last-buffer-was:save': () => this.save(),
    }));

  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.saveWhereLastBufferWasView.destroy();
  },

  serialize() {
    return {
      saveWhereLastBufferWasViewState: this.saveWhereLastBufferWasView.serialize()
    };
  },

  toggle() {
    console.log('save-where-last-buffer-was toggl!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },
  // overrides the default saving behavior
  save() {
    let target = atom.views.getView(atom.workspace)
    console.log('this.currentBufferPath is:' , this.currentBufferPath)
    console.log('this.lastTitledBufferPath is:' , this.lastTitledBufferPath)
    // If the current buffer is untitled, we open the "save" dialog in the
    // directory of the last titled buffer
    if (this.lastTitledBufferPath !== undefined && this.currentBufferPath === undefined) {
      this.textEditor.getSaveDialogOptions = () => {return {defaultPath: this.lastTitledBufferPath}}
      atom.commands.dispatch(target, 'core:save-as')
    } else {
      atom.commands.dispatch(target, 'core:save')
    }
  }

  // updateCurrentBufferPath() {
  //   if (typeof this.textEditor.getPath === 'function' ) {
  //     console.log('just bafter save this.currentBufferPath is:' , this.currentBufferPath)
  //     this.currentBufferPath = this.textEditor.getPath()
  //   }
  // }

};

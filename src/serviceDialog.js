(() => {
  "use strict";

  const { WindowTypeHint } = imports.gi.Gdk;
  // const { getEnum, connect } = imports.util;
  const { once } = imports.util;
  const {
    Box,
    Dialog,
    Align,
    Grid,
    Label,
    Entry,
    ResponseType,
    EntryIconPosition,
    Orientation,
  } = imports.gi.Gtk;
  const { uuid_string_random } = imports.gi.GLib;

  this.promptServiceDialog = async function promptServiceDialog({
    window,
    service,
  }) {
    // FIXME Gtk.Dialog.new_with_buttons
    // is undefined in gjs, open issue.
    // https://developer.gnome.org/hig/stable/dialogs.html.en#Action
    // "Action Dialogs"
    // and
    // https://developer.gnome.org/hig/stable/visual-layout.html.en
    const dialog = new Dialog({
      title: `Add ${service.name}`,
      modal: true,
      type_hint: WindowTypeHint.DIALOG,
      use_header_bar: true,
      transient_for: window,
      resizable: false,
    });

    dialog.add_button("Cancel", ResponseType.CANCEL);
    const addButton = dialog.add_button("Add", ResponseType.APPLY);
    addButton.get_style_context().add_class("suggested-action");
    addButton.grab_focus();

    const contentArea = dialog.get_content_area();
    contentArea.margin = 18;

    const grid = new Grid({
      column_spacing: 12,
      row_spacing: 6,
    });
    contentArea.add(grid);

    const nameLabel = new Label({
      label: "Name",
      halign: Align.END,
    });
    grid.attach(nameLabel, 1, 1, 1, 1);
    const nameEntry = new Entry({ text: service.name, hexpand: true });
    grid.attach(nameEntry, 2, 1, 1, 1);

    const URLLabel = new Label({
      label: "URL",
      halign: Align.END,
    });
    grid.attach(URLLabel, 1, 2, 1, 1);

    let getURL = () => {
      return service.url;
    };
    let URLEntry;
    let URLCell;

    if (service.url === "___") {
      URLEntry = new Entry({ text: "", hexpand: true });
      URLCell = URLEntry;
    } else if (!service.url.includes("___")) {
      URLEntry = new Entry({ text: service.url, hexpand: true });
      URLCell = URLEntry;
    } else {
      URLCell = new Box({
        orientation: Orientation.HORIZONTAL,
      });
      const [prefix, suffix] = service.url.split("___");
      const prefixLabel = new Label({ label: prefix });
      URLCell.add(prefixLabel);
      const interfixEntry = new Entry({ text: "", hexpand: true });
      URLCell.add(interfixEntry);
      const suffixLabel = new Label({ label: suffix });
      URLCell.add(suffixLabel);
      grid.attach(URLCell, 2, 2, 1, 1);
      getURL = () => {
        return service.url.replace("___", interfixEntry.text);
      };
      URLEntry = interfixEntry;
    }

    grid.attach(URLCell, 2, 2, 1, 1);

    addButton.set_sensitive(!!URLEntry.text);
    URLEntry.set_icon_tooltip_text(
      EntryIconPosition.SECONDARY,
      "Cannot be empty"
    );
    URLEntry.set_icon_activatable(EntryIconPosition.SECONDARY, false);
    URLEntry.connect("changed", () => {
      const isValid = !!URLEntry.text;
      if (isValid) {
        URLEntry.set_icon_from_icon_name(EntryIconPosition.SECONDARY, null);
        addButton.set_sensitive(true);
        return;
      }

      addButton.set_sensitive(false);
      URLEntry.set_icon_from_icon_name(
        EntryIconPosition.SECONDARY,
        "face-sick-symbolic"
      );
    });

    dialog.show_all();

    const [response_id] = await once(dialog, "response");
    if (response_id === ResponseType.DELETE_EVENT) {
      return;
    }
    if (response_id !== ResponseType.APPLY) {
      dialog.destroy();
      return;
    }

    const name = nameEntry.text;
    const url = getURL();

    dialog.destroy();

    return { name, url, id: uuid_string_random() };
  };
})();
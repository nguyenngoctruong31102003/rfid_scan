/** @odoo-module **/

import { registry } from "@web/core/registry";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { formView } from "@web/views/form/form_view";
import { useState, onWillStart, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { FormController } from "@web/views/form/form_controller";

export class ButtonFormController extends FormController {
  setup() {
    super.setup();
    this.rpc = useService("rpc");
    this.dialog = useService("dialog");
    this.webSocket = useService("webSocket");
    this.state = useState({
      ...this.state,
      scanned: false, // Biến lưu trạng thái đơn hàng đã quét
      scannedOrder: null, // Mã đơn hàng đã quét
    });
    onWillStart(async () => await this.initialize());
    onWillUnmount(this.webSocket.disconnect);
  }

  handleWebSocketMessage = async (e) => {
    let result;
    try {
      result = JSON.parse(e.data);
    } catch (error) {
      setTimeout(() => {
        if (document.getElementById("rfid_btn") != undefined)
          document.getElementById("rfid_btn").disabled = false;
      }, 4000);
      return;
    }
    if (result.code >= 400) {
      this.showNotification(result.message, "THÔNG BÁO", "danger");
      return;
    } else if (result.code >= 200 && result.code < 300) {
      if (result.code == 200) {
        try {
          const response = await this.rpc("/api/itemtracking.contacts", {
            order_code: result.tid,
            id: this.props.resId,
          });

          // Cập nhật trạng thái quét thẻ
          this.state.scanned = true;
          this.state.scannedOrder = result.tid;

          this.showNotification(result.message, "THÔNG BÁO", "success");

          // Mở form popup khi ấn Action "Xác Nhận Đơn Hàng"
          // Start PopUp
          let data = await this.orm.searchRead(
            "ir.model.data",
            [["name", "=", "view_itemtracking_popup_form"]],
            ["res_id"]
          );

          let action = {
            type: "ir.actions.act_window",
            name: "Xác Nhận Đơn Hàng",
            res_model: "itemtracking.contacts",
            domain: [],
            view_type: "form",
            views: [[data[0].res_id, "form"]],
            view_mode: "form",
            target: "new",
            res_id: this.props.resId,
          };
          // End PopUp

          this.env.services.action.doAction(action, {
            onClose: (result) => {},
          });
        } catch (error) {
          console.log(error);
          this.showNotification(
            "API chưa được tạo hoặc, Server bị lỗi!!",
            "THÔNG BÁO",
            "danger"
          );
        }
      }
      return;
    }
  };
  async initialize() {
    this.webSocket.connect();
    this.webSocket.onMessage(this.handleWebSocketMessage.bind(this));
  }

  onClick() {
    console.log(this.props.resId);

    // Nếu đơn hàng đã quét, gọi API để lấy thông tin lại và hiện popup
    if (this.state.scanned) {
      this.rpc("/api/itemtracking.contacts", {
        id: this.props.resId,
      })
        .then((response) => {
          if (response.status === "success") {
            this.state.scannedOrder = response.data.order_code;

            this.showNotification(
              `Đơn hàng đã quét: ${response.data.order_code}`,
              "THÔNG BÁO",
              "info"
            );

            // Mở form popup
            this.openPopupForm();
          } else {
            this.showNotification(response.message, "THÔNG BÁO", "danger");
          }
        })
        .catch((error) => {
          console.error(error);
          this.showNotification(
            "Lỗi khi lấy lại thông tin mã đơn hàng",
            "THÔNG BÁO",
            "danger"
          );
        });
      return;
    }

    // Logic quét thẻ nếu chưa được quét
    document.getElementById("rfid_btn").disabled = true;
    if (this.webSocket.isConnect() != 1) {
      document.getElementById("rfid_btn").disabled = false;
      this.showConfirmDialogDownloadPlugin(
        "THÔNG BÁO",
        "Vui lòng kiểm tra có đang chạy hay không, nếu chưa hãy nhấn vào nút [ OK ] bên dưới để cài đặt!"
      );
      return;
    }
    if (this.model.root.data.id == false) {
      this.showAlerDialog(
        "THÔNG BÁO",
        "CHƯA TẠO THÔNG TIN!!",
        "Vui lòng điền đầy đủ các thông tin đơn hàng!!!"
      );
      return;
    }

    try {
      //Gửi lệnh quét thẻ
      if (this.webSocket.isConnect() == 1) {
        this.webSocket.send("quet the tid|false");
      }
    } catch (error) {
      setTimeout(() => {
        if (document.getElementById("rfid_btn") != undefined)
          document.getElementById("rfid_btn").disabled = false;
      }, 4000);
    }
  }

  // Hàm mở popup form
  openPopupForm() {
    this.orm.searchRead(
      "ir.model.data",
      [["name", "=", "view_itemtracking_popup_form"]],
      ["res_id"]
    ).then((data) => {
      let action = {
        type: "ir.actions.act_window",
        name: "Xác Nhận Đơn Hàng",
        res_model: "itemtracking.contacts",
        domain: [],
        view_type: "form",
        views: [[data[0].res_id, "form"]],
        view_mode: "form",
        target: "new",
        res_id: this.props.resId,
      };

      this.env.services.action.doAction(action, {
        onClose: (result) => {},
      });
    });
  }

  showAlerDialog(title, content) {
    this.dialog.add(AlertDialog, {
      title: title,
      body: _t(content),
    });
  }

  showConfirmDialogDownloadPlugin(title, body) {
    const self = this;
    const dialog = self.env.services.dialog;
    dialog.add(
      ConfirmationDialog,
      {
        title: title,
        body: body,
        confirm: () => {
          window.open("/rfid_scan/static/file/APP_RFID_SCAN.rar");
        },
        cancel: () => {},
      },
      {
        onclose: () => {},
      }
    );
    document.getElementById("rfid_btn").disabled = false;
  }

  showNotification(content, title, type) {
    const notification = this.env.services.notification;
    notification.add(content, {
      title: title,
      type: type,
      className: "p-4",
    });
  }
}

ButtonFormController.template = "rfid_scan.RFID_button";
ButtonFormController.components = {
  ...FormController.components,
};

registry.category("views").add("rfid_button", {
  ...formView,
  Controller: ButtonFormController,
});

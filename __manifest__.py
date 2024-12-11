{
    # Tên module
    'name': 'T4TEK RFID Scan Odoo 17.0',
    'version': '1.0',

    # Loại module
    'category': 'T4TEK RFID Scan',

    # Độ ưu tiên module trong list module
    # Số càng nhỏ, độ ưu tiên càng cao
    #### Chấp nhận số âm
    'sequence': 1,

    # Mô tả module
    'summary': 'Module này dùng để quét thẻ rfid',
    'description': '',

    # Module dựa trên các category nào
    # Khi hoạt động, category trong 'depends' phải được install
    ### rồi module này mới đc install
    'depends': ['base_setup'],

    # Module có được phép install hay không
    # Nếu bạn thắc mắc nếu tắt thì làm sao để install
    # Bạn có thể dùng 'auto_install'
    'installable': True,
    'auto_install': False,
    'application': True,

    # Import các file cấu hình
    # Những file ảnh hưởng trực tiếp đến giao diện (không phải file để chỉnh sửa giao diện)
    ## hoặc hệ thống (file group, phân quyền)
    'data': [
        
    ],

    # Import các file cấu hình (chỉ gọi từ folder 'static')
    # Những file liên quan đến
    ## + các class mà hệ thống sử dụng
    ## + các chỉnh sửa giao diện
    ## + t
    'assets': {
         'web.assets_backend':
        [
            'rfid_scan/static/src/js/*.js',
            'rfid_scan/static/src/xml/*.xml',
        ]
    },
    'license': 'LGPL-3',
}

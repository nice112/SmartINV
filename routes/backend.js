// Import Express
const express = require('express')
// Import MSSQL
const mssql = require('mssql')

// Import package for PDF Export
const ejs = require("ejs")
const pdf = require("html-pdf")
const path = require("path")

// Import Export CSV file
const createCsvWriter = require("csv-writer").createObjectCsvWriter

// เรียกใช้งาน Moment เพื่อจัดรูปแบบวันที่
const moment = require('moment')

// Import mysql_dbconfig
const dbConnMySQL = require('../config/mysql_dbconfig')

// Import mssql_dbconfig
const dbConnMSSQL = require('../config/mssql_dbconfig')

// สร้างฟังก์ชัน Connect MSSQL Server
mssql.connect(dbConnMSSQL, (err) => {
    if(err){
        console.log("Error: " + err)
    }else{
        console.log("MSSQL Connect DB Success")
    }
})

const router = express.Router()

// สร้างฟังก์ชันแปลงยอดเงินให้เป็นรูปแบบสกุลเงิน (10,000.50)
const formatPrice = (value) => {
    let val = (value/1).toFixed(2).replace(',', ',')
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// กำหนดตัวแปรเก็บหมวดหมู่สินค้า
const category = ["","Mobile","Tablet","Smart Watch","Labtop"]

router.get('',(req, res)=>{
    res.render(
        'pages/backend/dashboard', 
        { 
            title: 'Dashboard', 
            heading: 'Dashboard',
            layout: './layouts/backend'
        }
    )
})

// List Product from MySQL
router.get('/mysqlproducts',(req, res)=>{
    let sql = "SELECT * FROM products"
    dbConnMySQL.query(sql, (err, rows)=>{
        if(err){
            res.send(err)
        }else{
            // res.json(rows)
            res.render(
                'pages/backend/mysqlproducts', 
                { 
                    title: 'MySQL Products', 
                    heading: 'MySQL Products',
                    layout: './layouts/backend',
                    data: rows,
                    moment: moment,
                    formatPrice: formatPrice
                }
            )
        }
    })
})

// List Product from MSSQL Server
router.get('/mssqlproducts',(req, res)=>{
    let sql = "SELECT * FROM products"
    let request = new mssql.Request()

    request.query(sql, (err, rows)=>{
        if(err){
            res.send(err)
            throw err
        }else{
            // res.json(rows.recordset)
            res.render(
                'pages/backend/mssqlproducts', 
                { 
                    title: 'MSSQL Products', 
                    heading: 'MSSQL Products',
                    layout: './layouts/backend',
                    data: rows.recordset,
                    moment: moment,
                    formatPrice: formatPrice,
                    category: category
                }
            )
        }
    })
})

// Create MSSQL Product
router.get('/mssql_create_product',(req, res)=>{
    res.render(
        'pages/backend/mssql_create_product', 
        { 
            title: 'MSSQL Create Product', 
            heading: 'MSSQL Create Product',
            layout: './layouts/backend'
        }
    )
})

// Create MSSQL Product POST
router.post('/mssql_create_product',(req, res)=>{

    // รับค่าฟอร์ม
    let ProductName = req.body.ProductName
    let CategoryID = req.body.CategoryID
    let UnitPrice = req.body.UnitPrice
    let UnitInStock = req.body.UnitInStock
    let ProductPicture = req.body.ProductPicture
    let curdatetime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") // วันที่ปัจจุบัน
    let errors = false // เก็บสถานะของฟอร์มว่าป้อนข้อมูลครบหรือไม่

    // res.send(ProductName+"<br>"+CategoryID+"<br>"+UnitPrice+"<br>"+UnitInStock+"<br>"+ProductPicture+"<br>"+curdatetime)
    // ตรวจสอบว่าป้อนข้อมูลครบ
    if(ProductName.length === 0 || UnitPrice === '' || UnitInStock === ''){
        errors = true

        // แสดงข้อความแจ้งว่าป้อนให้ครบ
        req.flash('error','ป้อนข้อมูลในฟิลด์ที่บังคับให้ครบ')

        // ให้รีโหลดหน้าฟอร์มเพิ่มสินค้า
        res.render(
            'pages/backend/mssql_create_product', 
            { 
                title: 'MSSQL Create Product', 
                heading: 'MSSQL Create Product',
                layout: './layouts/backend'
            }
        )
    }

    // ถ้าตรวจสอบฟอร์มผ่านแล้ว
    if(!errors){
        let request = new mssql.Request()
        let sql = `INSERT INTO products(
                CategoryID,
                ProductName,
                UnitPrice,
                ProductPicture,
                UnitInStock,
                CreatedDate,
                ModifiedDate
            )VALUES(
                '${CategoryID}',
                '${ProductName}',
                '${UnitPrice}',
                '${ProductPicture}',
                '${UnitInStock}',
                '${curdatetime}',
                '${curdatetime}'
            )`
        request.query(sql, (err, result)=>{
            if(err){
                req.flash('error', err)
            }else{
                req.flash('success', 'เพิ่มรายการสินค้าเรียบร้อยแล้ว')
                // ให้รีโหลดหน้าฟอร์มเพิ่มสินค้า
                res.render(
                    'pages/backend/mssql_create_product', 
                    { 
                        title: 'MSSQL Create Product', 
                        heading: 'MSSQL Create Product',
                        layout: './layouts/backend'
                    }
                )
            }
        })
    }
})

// Edit MSSQL Product
router.get('/mssql_edit_product/(:id)',(req, res)=>{

    let id = req.params.id
    
    let sql = "SELECT * FROM products WHERE ProductID=" + id
    let request = new mssql.Request()

    request.query(sql, (err, rows)=>{
        if(err){
            res.send(err)
            throw err
        }else{
            // res.json(rows.recordset)
            res.render(
                'pages/backend/mssql_edit_product', 
                { 
                    title: 'MSSQL Edit Products', 
                    heading: 'MSSQL Edit Products',
                    layout: './layouts/backend',
                    data: rows.recordset,
                    category: category
                }
            )
        }
    })
})


// EDIT MSSQL Product POST
router.post('/mssql_edit_product/:id',(req, res)=>{

    let id = req.params.id

    // รับค่าฟอร์ม
    let ProductName = req.body.ProductName
    let CategoryID = req.body.CategoryID
    let UnitPrice = req.body.UnitPrice
    let UnitInStock = req.body.UnitInStock
    let ProductPicture = req.body.ProductPicture
    let curdatetime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") // วันที่ปัจจุบัน
    let errors = false // เก็บสถานะของฟอร์มว่าป้อนข้อมูลครบหรือไม่

    // ตรวจสอบว่าป้อนข้อมูลครบ
    if(ProductName.length === 0 || UnitPrice === '' || UnitInStock === ''){
        errors = true

        // แสดงข้อความแจ้งว่าป้อนให้ครบ
        req.flash('error','ป้อนข้อมูลในฟิลด์ที่บังคับให้ครบ')

        // ให้รีโหลดหน้าฟอร์มเพิ่มสินค้า
        res.render(
            'pages/backend/mssql_create_product', 
            { 
                title: 'MSSQL Create Product', 
                heading: 'MSSQL Create Product',
                layout: './layouts/backend'
            }
        )
    }

    // ถ้าตรวจสอบฟอร์มผ่านแล้ว
    if(!errors){
        let request = new mssql.Request()
        let sql = `UPDATE products SET 
                CategoryID='${CategoryID}',
                ProductName='${ProductName}',
                UnitPrice='${UnitPrice}',
                ProductPicture='${ProductPicture}',
                UnitInStock='${UnitInStock}',
                CreatedDate='${curdatetime}',
                ModifiedDate='${curdatetime}' 
            WHERE ProductID='${id}'`
        request.query(sql, (err, result)=>{
            if(err){
                req.flash('error', err)
            }else{
                res.redirect('/backend/mssqlproducts')
            }
        })
    }
})


// DELETE MSSQL Product
router.get('/mssql_delete_product/:id',(req, res)=>{
    let id = req.params.id
    let sql = `DELETE products WHERE ProductID=${id}`
    let request = new mssql.Request()

    request.query(sql, (err, rows)=>{
        if(err){
            res.send(err)
            throw err
        }else{
            res.redirect('/backend/mssqlproducts')
        }
    })
})

// Export CSV MSSQL Product
router.get('/mssql_exportcsv_product',(req, res)=>{

    let sql = 'SELECT ProductID,CategoryID,ProductName,UnitPrice,UnitInStock FROM products'
    let request = new mssql.Request()
    let file_csv_name = "product-"+moment(new Date()).format("YYYY-MM-DD-ss")+".csv"

    request.query(sql, (err, rows)=>{
        if(err){
            res.send(err)
            throw err
        }else{
            const csvWriter = createCsvWriter({
                path: file_csv_name,
                header: [
                  { id: "ProductID", title: "ProductID" },
                  { id: "CategoryID", title: "CategoryID" },
                  { id: "ProductName", title: "ProductName" },
                  { id: "UnitPrice", title: "UnitPrice" },
                  { id: "UnitInStock", title: "UnitInStock" },
                ],
            })
          
            csvWriter
                .writeRecords(rows.recordset)
                .then(() => {
                    res.download(file_csv_name)
                }
            )
        }
    })
})


// Export PDF MSSQL Product
router.get('/mssql_exportpdf_product',(req, res)=>{

    let sql = 'SELECT ProductID,CategoryID,ProductName,UnitPrice,UnitInStock FROM products'
    let request = new mssql.Request()

    let file_pdf_name = "./pdfexport/product-"+moment(new Date()).format("YYYY-MM-DD-ss")+".pdf"

    request.query(sql, (err, rows)=>{
        if(err){
            res.send(err)
            throw err
        }else{
            ejs.renderFile(path.join(__dirname,'../views/pages/backend/',"demopdf.ejs"),{products: rows.recordset}, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "297 mm",
                        "width": "210 mm",
                        "header": {
                            "height": "20mm"
                        },
                        "footer": {
                            "height": "20mm",
                        },
                    }
                    pdf.create(data, options).toFile(file_pdf_name, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {

                            // res.send("File created successfully")
                            res.download(file_pdf_name)

                            // ลบไฟล์ 
                            // fs.unlinkSync(file_pdf_name)
                        }
                    })
                }
            })
        }
    })
})


module.exports = router
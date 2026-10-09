// customMa.js
export const customMa = {
  name: 'MCMA',
  shortName: 'MCMA',
  series: 'price',
  type: 'main',
  precision: 2,
  figures: [{
        key: 'close',
        title: 'close: ',
        type: 'line'
    }],
    calc: dataList => dataList.map(data => ({ close: data.close }))
}

// export default customMa

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  selectedFile: File;
  userData: StatisticsData[] = [];

  Highcharts = Highcharts;
  chartConstructor = 'chart';
  updateFlag = false;
  oneToOneFlag = true;

  chartOptions = {
    chart: {
      // type: 'line',
      zoomType: 'x'
    },
    credits: {
      enabled: false
    },
    title: {
      text: 'Your Health Progress'
    },
    subtitle: {
      text: 'PAIN IS GAIN!'
    },
    xAxis: {
      type: 'datetime'
    },
    yAxis: [{
      title: {
        text: 'Lean Body Mass'
      },
      labels: {
        format: '{value} kg'
      }
    }, {
      title: {
        text: 'Body Fat'
      },
      opposite: true,
      labels: {
        format: '{value} kg'
      }
    }],
    // legend: {
    //   layout: 'vertical',
    //   align: 'right',
    //   verticalAlign: 'middle'
    // },
    plotOptions: {
      series: {
      }
    },
    series: []
    //  [{
    //   name: 'Installation',
    //   data: [43934, 52503, 57177, 69658, 97031, 119931, 137133, 154175],
    //   yAxis: 0,
    // }, {
    //   name: 'Manufacturing',
    //   data: [24916, 24064, 29742, 29851, 32490, 30282, 38121, 40434],
    //   yAxis: 1,
    // }]
  };


  form = new FormGroup({
    chest: new FormControl(null),
    abdominal: new FormControl(null),
    thigh: new FormControl(null),
    age: new FormControl(null),
    weight: new FormControl(null),
  });

  calculatedValues: StatisticsData;

  ngOnInit() { }

  uploadFile(event: any) {
    this.selectedFile = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(this.selectedFile, 'UTF-8');
    fileReader.onload = () => {
      const parsedData = JSON.parse(fileReader.result as string);
      this.userData = parsedData;
      console.log(this.userData);
      this.showChart();
      this.updateFlag = true;
    };
    fileReader.onerror = (error) => {
      console.log(error);
    };
  }

  downloadFile(content: StatisticsData[]) {
    const json = JSON.stringify(content);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=UTF-8,' + encodeURIComponent(json));
    element.setAttribute('download', 'body-fat-calculator-statistics.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  calculateBodyDensity(chestMM: number, abdominalMM: number, thighMM: number, age: number) {
    const sumOfSkinFolds: number = chestMM + abdominalMM + thighMM;
    const bodyDensity: number = 1.10938 - (0.0008267 * sumOfSkinFolds) + (0.0000016 * Math.pow(sumOfSkinFolds, 2)) - (0.0002574 * age);
    return bodyDensity;
  }

  calculateBodyFatPercentage(bodyDensity: number) {
    const bodyFatPercentage = (495 / bodyDensity) - 450;
    return bodyFatPercentage;
  }

  calculateValues() {
    const values = this.form.value;
    console.log(values);
    const bodyDensity = this.calculateBodyDensity(values.chest, values.abdominal, values.thigh, values.age);
    const bodyFatPercentage = this.calculateBodyFatPercentage(bodyDensity);
    const calculatedValues: StatisticsData = {
      timestamp: Date.now(), abdominal: values.abdominal, age: values.age, chest: values.chest, weight: values.weight, thigh: values.thigh,
      bodyDensity, bodyFatPercentage, bodyFat: values.weight * (bodyFatPercentage / 100),
      leanBodyMass: values.weight - (values.weight * (bodyFatPercentage / 100))
    };
    this.calculatedValues = calculatedValues;
  }

  addValues() {
    if (this.calculatedValues) {
      this.userData.push(this.calculatedValues);
      this.form.reset();
      this.showChart();
      this.updateFlag = true;
    }
  }

  showChart() {
    this.chartOptions.series = [];
    this.chartOptions.series.push({
      name: 'Lean Body Mass',
      data: this.userData.map(x => (
        [x.timestamp, x.leanBodyMass]
      )
      ),
      yAxis: 0,
    });
    this.chartOptions.series.push({
      name: 'Body Fat',
      data: this.userData.map(x => (
        [x.timestamp, x.bodyFat]
      )
      ),
      yAxis: 1,
    });
  }

}

interface StatisticsData {
  timestamp: number;
  chest: number;
  abdominal: number;
  thigh: number;
  age: number;
  bodyFatPercentage: number;
  bodyFat: number;
  bodyDensity: number;
  leanBodyMass: number;
  weight: number;
}

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import EntypoIcons from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Picker from 'react-native-picker';
import {
  View,
  ScrollView,
  Text,
  LayoutAnimation,
  Dimensions,
  TouchableHighlight,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';

import styles from '../styles/schedule';
import * as CourseActions from '../actions/course';

import { sectionMap } from '../api/utils.js';

const mapStateToProps = state => ({
  auth: state.auth,
  course: state.course,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  ...CourseActions,
}, dispatch);

const { width } = Dimensions.get('window');

import { SortByDay } from '../api/xmlparser';

class Schedule extends Component {

  constructor(props) {
    super(props);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
    const current = (new Date().getDay() + 8) % 8;
    this.state = {
      loading: true,
      delay: true,
      current,
      semester: null,
    };
    const { user: { LoginTicket, AccountId } } = this.props.auth;
    this.props.getCourseInfo(LoginTicket, AccountId, 'stu')
      .then(({ payload }) => this.props.getSchedule(payload))
      .then(() => this.initSchedule())
      .then(() => this.dayScrollView.scrollTo({ x: (current - 1) * width, animated: false }));
  }

  initSchedule() {
    const { current } = this.state;
    const { schedule } = this.props.course;
    this.setState({ loading: false, semester: Object.keys(schedule)[0] });
    // Picker init
    Picker.init({
      pickerData: Object.keys(schedule),
      pickerTitleText: '選擇學期',
      pickerConfirmBtnText: '確定',
      pickerCancelBtnText: '',
      onPickerSelect: ([semester]) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        this.setState({
          semester,
        });
      },
    });
    Picker.hide();
    setTimeout(() => this.setState({ delay: false }), 200);
  }

  handleScroll(evt) {
    Picker.hide();
    if (!this.state.delay) {
      const { x } = evt.nativeEvent.contentOffset;
      const { width } = evt.nativeEvent.layoutMeasurement;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      this.setState({
        current: Math.min(Math.max(Math.floor(x / width + 0.5) + 1, 0), 7),
      });
    }
  }

  handlePressIndicator(current) {
    this.dayScrollView.scrollTo({ x: (current - 1) * width, animated: false });
  }

  getTimeString(section) {
    return `${sectionMap[_.head(section)].from} ~ ${sectionMap[_.last(section)].to}  時段: ${section.join('')}`;
  }

  render() {
    const { loading, current, semester } = this.state;
    const left = 15 + (width / 7) * (current - 1);
    const { schedule } = this.props.course;
    return (loading ?
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>
          Loading
        </Text>
      </View> :
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.scheduleActionContainer}>
          <TouchableHighlight
            style={styles.scheduleSelect}
            underlayColor={'transparent'}
            onPress={() => Picker.toggle()}
          >
            <Text
              style={styles.scheduleSelectText}
            >
              {semester}
            </Text>
          </TouchableHighlight>
        </View>
        <View style={styles.dayNavigator}>
          {
          ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((value, index) => (
            <TouchableHighlight
              key={index}
              style={styles.dayNavigatorContainer}
              underlayColor={'transparent'}
              activeOpacity={0.5}
              onPressIn={() => this.handlePressIndicator(index + 1)}
            >
              <Text style={styles.dayNavigatorText}>
                {value}
              </Text>
            </TouchableHighlight>
          ))
        }
        </View>
        <View style={[styles.dayNavigatorIndicator, { left }]} />
        <ScrollView
          horizontal
          pagingEnabled
          ref={(c) => { this.dayScrollView = c; }}
          onScroll={evt => this.handleScroll(evt)}
          scrollEventThrottle={200}
          showsHorizontalScrollIndicator={false}
          style={styles.container}
        >
          {
            schedule[semester].map((list, idx) => (
              <View
                style={styles.pageContainer}
                key={idx}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.dayContainer}
                >
                  {(
                    list.length === 0 ?
                      <View>
                        <Text />
                      </View> :
                    list.map(({ CourseName, Section, RoomNo }) => (
                      <View key={CourseName} style={styles.timeContainer}>
                        <Text style={styles.courseName}>
                          {CourseName}
                        </Text>
                        <EntypoIcons.Button
                          style={styles.courseLocationContainer}
                          name="location"
                          backgroundColor={'transparent'}
                          color={'rgb(228,129,132)'}
                          size={18}
                        >
                          <Text style={styles.courseLocation}>{RoomNo}</Text>
                        </EntypoIcons.Button>
                        <MaterialCommunityIcons.Button
                          style={styles.courseTimeContainer}
                          name="clock"
                          backgroundColor={'transparent'}
                          color={'rgb(137,135,231)'}
                          size={18}
                        >
                          <Text style={styles.courseTime}>{this.getTimeString(Section)}</Text>
                        </MaterialCommunityIcons.Button>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            ))
        }
        </ScrollView>
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Schedule);

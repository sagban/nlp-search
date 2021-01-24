import './App.css';
import React from "react";
import YoutubeIFrame from "./components/YoutubeIFrame";
import axios from "axios";
import Chart from 'chart.js';

const _ = require('lodash');
const App = () => {
    const submitUrlHandler = () => {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            setVideoId(match[2]);
            axios.get(`https://get-transcripts.azurewebsites.net/api/hack?code=Bz7Fagkn0m3k7br2RRIeg7kDda3UVRzWnJJixs13sXYzuoZTjrd2Uw==&videoId=${match[2]}`)
                .then(res => setCaptions(res.data))
                .catch(err => console.error(err))
        } else {
            alert("Invalid URL");
            setVideoId("");
        }
    }

    const searchPhraseHandler = () => {
        let matches = [];
        axios.post('https://hackathon.autokaas.com/get_similarWords', {"words": [phrase]}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            let arr = [...res.data.similar_words, phrase];
            let tempTranscript = " ";
            captions.forEach(caption => {
                tempTranscript += " " + caption.text;
                for (let i = 0; i < arr.length; i++) {
                    if (_.includes(caption.text, arr[i].replace("_", " "))) {
                        matches.push({...caption, matchedPhrase: arr[i]});
                        break;
                    }
                }
            })
            setTranscript(tempTranscript);
            setMatchedCaptions(matches);
        })
            .catch(err => console.log(err));
    }

    const getKeyNotes = () => {
        let matches = [];
        axios.post('https://hackathon.autokaas.com/tagExtractor', {"text": transcript}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            let tagArray = res.data.response[0].tags;
            setKeyNotes(tagArray);
        })
            .catch(err => console.log(err));
    }

    const getSentimentAnalysis = () => {
        let sentimentsArray = [];
        axios.get(`https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=25&order=relevance&videoId=${videoId}&key=AIzaSyApX3bSpv8b3y1PEiA29VYI5jh1ZEyd7EQ`)
            .then(res => {
                let comments = [];
                let commentObjs = res.data.items;
                commentObjs.forEach(comObj => {
                    comments.push(comObj.snippet.topLevelComment.snippet.textDisplay)
                });
                axios.post("https://hackathon.autokaas.com/get_sentiment", {"texts": comments}, {
                    headers: {
                        "accept": "application/json",
                        "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                        "Content-Type": "application/json",
                    }
                }).then(r => {
                    sentimentsArray = r.data.results;
                    let chartData = [_.sumBy(sentimentsArray, (o) => o.scores['1 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['2 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['3 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['4 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['5 star'])]
                    console.log(chartData);
                    console.log("henlo");
                    const ctx = document.getElementById("myChart");
                    new Chart(ctx, {
                        type: "pie",
                        data: {
                            labels: ["Dont even think about it", "Not Good", "Okaish", "Good", "Awesome"],
                            datasets: [
                                {
                                    label: "# of Votes",
                                    data: chartData,
                                    backgroundColor: [
                                        "Black",
                                        "Gray",
                                        "Yellow",
                                        "Pink",
                                        "Red"
                                    ],
                                    borderColor: ["Dont even think about it", "Not Good", "Okaish", "Good", "Awesome"],
                                    borderWidth: 1
                                }
                            ]
                        }
                    });
                })
                    .catch(er => console.error(er));
            })
            .catch(err => console.error(err));
        console.log(sentimentsArray);

    }

    const [matchedCaptions, setMatchedCaptions] = React.useState([]);
    const [captions, setCaptions] = React.useState([]);
    const [url, setUrl] = React.useState("");
    const [videoId, setVideoId] = React.useState("");
    const [phrase, setPhrase] = React.useState("");
    const [transcript, setTranscript] = React.useState("");
    const [startTime, setStartTime] = React.useState(0);
    const [keyNotes, setKeyNotes] = React.useState([]);
    return (
        <div className="App">
            https://www.youtube.com/watch?v=lyRPyRKHO8M&t=2s
            <label itemID="youtubeUrl">Enter youtube Url<br/>
                <input type="url" name="Youtube Url" id="youtubeUrl" value={url}
                       onChange={(e) => setUrl(e.target.value)}/>
            </label>
            <br/>
            <button type="submit" onClick={submitUrlHandler}>GetVideo</button>
            <div className="grid-container">
                <div className="grid-item">
                    <header className="App-header">
                        {videoId.length === 11 ?
                            <YoutubeIFrame videoId={videoId} startTimeInSeconds={Math.floor(startTime)}/> :
                            <strong> Enter youtube URl</strong>}
                    </header>
                </div>
                <div className="grid-item">
                    <label itemID="phrase">Enter phrase<br/>
                        <input type="text" name="Pharse" id="phrase" value={phrase}
                               onChange={(e) => setPhrase(e.target.value)}/>
                    </label>
                    <button type="submit" onClick={searchPhraseHandler}>Search</button>
                    <br/>
                    {matchedCaptions.map(c => <button className="btn btn-success" onClick={() => setStartTime(c.start)}
                                                      type="submit">{c.matchedPhrase} - {c.start}</button>)}
                    <div>
                        {transcript.length > 0 ?
                            <button type="submit" onClick={getKeyNotes}>Get Keypoints</button> : null}
                            <br/>
                        {keyNotes.map(keyNote => <span className="badge bg-warning text-dark">{keyNote}</span>)}
                    </div>
                    <button type="submit" onClick={getSentimentAnalysis}>Analyse Sentiment</button>
                </div>
            </div>
        </div>
    );
};

export default App;

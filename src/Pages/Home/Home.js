import React from "react";
import './Home.css'
import axios from "axios/index";
import YoutubeIFrame from "../../Components/YoutubeIFrame";
import Chart from "chart.js";

const _ = require('lodash');

const Home = () => {

    const [matchedCaptions, setMatchedCaptions] = React.useState([]);
    const [captions, setCaptions] = React.useState([]);
    const [url, setUrl] = React.useState("");
    const [videoId, setVideoId] = React.useState("");
    const [phrase, setPhrase] = React.useState("");
    const [transcript, setTranscript] = React.useState("");
    const [startTime, setStartTime] = React.useState(0);
    const [keyNotes, setKeyNotes] = React.useState([]);
    const [summary, setSummary] = React.useState("");
    const [matchedCaptionFound, setMatchedCaptionFound] = React.useState(true);

    const getTranscriptHandler = () => {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            setVideoId(match[2]);
            axios.get(`https://get-transcripts.azurewebsites.net/api/hack?code=Bz7Fagkn0m3k7br2RRIeg7kDda3UVRzWnJJixs13sXYzuoZTjrd2Uw==&videoId=${match[2]}`)
                .then(res => {
                    let tempTranscript = " ";
                    res.data.forEach(caption => {
                        console.log(tempTranscript + "henlo")
                        tempTranscript += " " + caption.text;
                    })
                    setTranscript(tempTranscript);
                    setCaptions(res.data);
                })
                .catch(err => console.error(err))
        } else {
            alert("Invalid URL");
            setVideoId("");
        }
    };
    const getKeyNotes = () => {
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
    };
    const searchPhraseHandler = () => {
        setMatchedCaptionFound(true);
        let matches = [];
        axios.post('https://hackathon.autokaas.com/get_similarWords', {"words": [phrase]}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            let arr = [...res.data.similar_words, phrase];
            captions.forEach(caption => {
                for (let i = 0; i < arr.length; i++) {
                    if (_.includes(caption.text, arr[i].replace("_", " "))) {
                        matches.push({...caption, matchedPhrase: arr[i]});
                        break;
                    }
                }
            });
            setMatchedCaptions(matches);
            setMatchedCaptionFound(matches.length > 0);
        })
            .catch(err => console.log(err));
    };

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
                    const ctx = document.getElementById("sa-chart");
                    new Chart(ctx, {
                        type: "pie",
                        data: {
                            labels: ["Don't even think about it", "Not Good", "Okaish", "Good", "Awesome"],
                            datasets: [
                                {
                                    label: "# of Votes",
                                    data: chartData,
                                    backgroundColor: [
                                        "#FCEEF3",
                                        "#F9D9E5",
                                        "#FA9CBE",
                                        "#F9679C",
                                        "#ff0560"
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

    };

    const getSummary = () => {
        axios.post('https://hackathon.autokaas.com/summary', {payload: [{text: transcript}]}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            setSummary(res.data.response[0].summary_text);
        })
            .catch(err => console.log(err));
    }

    return (<div>
        <div id="home">
            <div className="container fullheight home">
                <div className="row">
                    <div className="col-md-7 col-xs-12">
                        <h1 className="color-primary">Elysium</h1>
                        <p className="color-white fontsize-lg">
                            A NLP tool for remove those hassles of finding that “the” moment in the video to give user
                            quick and most relevant content.
                        </p>
                        <a href="#getstarted" className="button">Get Started</a>
                    </div>
                </div>
            </div>
        </div>
        <div className="container transcript" id="getstarted">
            <div className="text-centre"><h1 className="color-dark">Get Started</h1></div>
            <div className="row">
                <div className="col-md-6">
                    <div className="inner">
                        <label itemID="youtubeUrl">Youtube URL *</label>
                        <input className="input" type="url" name="Youtube Url" id="youtubeUrl" value={url}
                               placeholder="Enter Youtube URL"
                               onChange={(e) => setUrl(e.target.value)}/>
                        <button type="submit" className="button button-v2" onClick={getTranscriptHandler}>Get Video
                        </button>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="grid-item">
                        <header className="App-header">
                            {videoId.length === 11 ?
                                <YoutubeIFrame videoId={videoId} startTimeInSeconds={Math.floor(startTime)}/> :
                                <div className="dummy"/>}
                        </header>
                    </div>
                </div>
            </div>
            <div>
                {transcript.length > 0 ?
                    <button className="button button-v2" type="submit" onClick={getSummary}>Get
                        Summary</button> : null}
                <br/>
                {summary}
            </div>
            {videoId.length > 0 ?
                <div>
                    <div>
                        {transcript.length > 0 ?
                            <button className="button button-v2" type="submit" onClick={getKeyNotes}>Get
                                Keypoints</button> : null}
                        <br/>
                        {keyNotes.map(keyNote => <span className="badge bg-warning text-dark">{keyNote}</span>)}
                    </div>
                    <div>
                        <label itemID="phrase">Search Phrase *</label>
                        <input className="input" type="text" name="Pharse" id="phrase" value={phrase}
                               placeholder="Enter Phrase"
                               onChange={(e) => setPhrase(e.target.value)}/>

                        <button className="button button-v2" type="submit" onClick={searchPhraseHandler}>Search</button>
                        <br/>
                        {matchedCaptions.map(c => <button className="button button-v2"
                            onClick={() => setStartTime(c.start)}
                            type="submit">{c.matchedPhrase} - {c.start}</button>)}
                        {!matchedCaptionFound ? "Try with a different phrase" : null}
                    </div>
                    <div>
                        <button className="button button-v2" type="submit" onClick={getSentimentAnalysis}>Analyse
                            Sentiment
                        </button>
                        <canvas id="sa-chart"/>
                    </div>
                </div>
                : ""}


        </div>

    </div>)

};

export default Home;

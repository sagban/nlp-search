import React from "react";
import './Home.css'
import axios from "axios/index";
import YoutubeIFrame from "../../Components/YoutubeIFrame";
import Loader from "../../Components/Loader";
import Chart from "chart.js";
import LanguageSelector from "../../Components/LanguageSelector";

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
    const [langValue, setLangValue] = React.useState(-1);

    const [vis1, setVis1] = React.useState(false);
    const [vis2, setVis2] = React.useState(false);
    const [vis3, setVis3] = React.useState(false);
    const [vis4, setVis4] = React.useState(false);
    const [loader, setLoader] = React.useState(false);
    const [summaryLoader, setSummaryLoader] = React.useState(false);
    const [spLoader, setSpLoader] = React.useState(false);
    const [knLoader, setKnLoader] = React.useState(false);
    const [saLoader, setSaLoader] = React.useState(false);

    const getTranscriptHandler = () => {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            setVideoId(match[2]);
            setLoader(true);
            axios.get(`https://get-transcripts.azurewebsites.net/api/hack?code=Bz7Fagkn0m3k7br2RRIeg7kDda3UVRzWnJJixs13sXYzuoZTjrd2Uw==&videoId=${match[2]}`)
                .then(res => {
                    setLoader(false);
                    let tempTranscript = " ";
                    res.data.forEach(caption => {
                        tempTranscript += " " + caption.text;
                    });
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
        setKnLoader(true);
        axios.post('https://hackathon.autokaas.com/tagExtractor', {"text": transcript}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            setKnLoader(false);
            let tagArray = res.data.response[0].tags;
            setKeyNotes(tagArray);
            console.log(tagArray)
        })
            .catch(err => console.log(err));
    };
    const searchPhraseHandler = async () => {
        let englishLangPhrase = phrase;
        setSpLoader(true);
        if (langValue !== -1) {
            englishLangPhrase = await axios.post('https://hackathon.autokaas.com/translate_to_en', {texts: [phrase]}, {
                headers: {
                    "accept": "application/json",
                    "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                    "Content-Type": "application/json"
                }
            }).then(res => {
                setMatchedCaptionFound(true);
                console.log(res);
                return res.data.results[0];
            }).catch(err => console.error(err));
        }

        let matches = [];
        axios.post('https://hackathon.autokaas.com/get_similarWords', {"words": [englishLangPhrase]}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            setSpLoader(false);
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
        setSaLoader(true);
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
                    setSaLoader(false);
                    sentimentsArray = r.data.results;
                    let chartData = [_.sumBy(sentimentsArray, (o) => o.scores['1 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['2 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['3 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['4 star']),
                        _.sumBy(sentimentsArray, (o) => o.scores['5 star'])]
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
        setSummaryLoader(true);
        axios.post('https://hackathon.autokaas.com/summary', {payload: [{text: transcript}]}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            setSummaryLoader(false);
            setSummary(res.data.response[0].summary_text);
        })
            .catch(err => console.log(err));
    };

    const update = (vis) => {
        setVis1(false);
        setVis2(false);
        setVis3(false);
        setVis4(false);
        switch (vis) {
            case 1:
                setVis1(true);
                break;
            case 2:
                setVis2(true);
                break;
            case 3:
                setVis3(true);
                break;
            case 4:
                setVis4(true);
                break;
        }
    };

    return (<div>
        <div id="home">
            <div className="container fullheight home">
                <div className="row">
                    <div className="col-md-5 col-xs-12">
                        <h1 className="color-white">Elysium</h1>
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
                        {loader ? <Loader/> : ""}
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
            {videoId.length > 0 && transcript.length > 0 ?
                <div>
                    <div className="row">
                        <h3 className="fontsize-md color-dark">Select Any</h3>
                        <div className="col-md-8">
                            <div className="inline">
                                {transcript.length > 0 ?
                                    <button className="button button-v3" type="submit" onClick={() => {
                                        getSummary();
                                        update(1);
                                    }}>Get
                                        Summary</button> : null}
                            </div>
                            <div className="inline">
                                {transcript.length > 0 ?
                                    <button className="button button-v3" type="submit" onClick={() => {
                                        getKeyNotes();
                                        update(2)
                                    }}>
                                        Key Notes</button> : null}
                                <br/>

                            </div>
                            <div className="inline">
                                <button className="button button-v3" onClick={() => {
                                    update(3)
                                }}> Search Phrase
                                </button>
                            </div>
                            <div className="inline">
                                <button className="button button-v3" type="submit"
                                        onClick={() => {
                                            getSentimentAnalysis();
                                            update(4)
                                        }}>Analyse
                                    Sentiment
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        {vis1 ?
                            <div className="col-md-12">
                                <h2>Summary</h2>
                                {summaryLoader ? <Loader/> : ""}
                                {summary.length > 0 ? summary : ""}
                            </div>
                            : ""}
                        {vis2 ?
                            <div className="col-md-12">
                                <h2>Key Notes</h2>
                                {knLoader ? <Loader/> : ""}
                                {keyNotes.map(keyNote => <div style={{"display": "inline-table"}}><span
                                    className="button button-v3 button-sm">{keyNote}</span></div>)}
                            </div> : ""
                        }
                        {vis3 ?
                            <div className="col-md-12">
                                <div>
                                    <h2>Search Phrase</h2>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <label itemID="phrase">Phrase *</label>
                                            <input className="input" type="text" name="Phrase" id="phrase"
                                                   value={phrase}
                                                   placeholder="Enter Phrase"
                                                   onChange={(e) => setPhrase(e.target.value)}/>
                                        </div>
                                        <div className="col-md-6">
                                            <LanguageSelector langValue={langValue} setLangValue={setLangValue}/>
                                        </div>
                                        <div className="col-md-12">
                                            <button className="button button-v2" type="submit"
                                                    onClick={searchPhraseHandler}>Search
                                            </button>
                                        </div>
                                    </div>
                                    {spLoader ? <Loader/> : ""}
                                    {matchedCaptions.map(c => <div style={{"display": "inline-table"}}>
                                        <button className="button button-v3 button-sm"
                                                onClick={() => setStartTime(c.start)}
                                                type="submit">{c.matchedPhrase} - {c.start}</button>
                                    </div>)}
                                    {!matchedCaptionFound ? "Try with a different phrase" : null}
                                </div>
                            </div> : ""
                        }
                        {vis4 ?
                            <div className="col-md-12">
                                <h2>Sentimental Analysis</h2>
                                {saLoader ? <Loader/> : ""}
                                <canvas id="sa-chart"/>
                            </div> : ""
                        }

                    </div>
                </div>
                : ""}
        </div>

    </div>)

};

export default Home;

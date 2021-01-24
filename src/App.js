import './App.css';
import React from "react";
import YoutubeIFrame from "./components/YoutubeIFrame";
import axios from "axios";

const _ = require('lodash');
const commentScrapper = require('youtube-comment-api');
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
        axios.post('https://hackathon.autokaas.com/get_nerTags', {"text": transcript}, {
            headers: {
                "accept": "application/json",
                "X-API-KEY": "oDtOHyuaEb2D0J6WGkAwv4rhn7hTIl8c4u3P5hic",
                "Content-Type": "application/json"
            }
        }).then(res => {
            console.log(res.data)
        })
            .catch(err => console.log(err));
    }

    const getSentimentAnalysis = () => {
        commentScrapper(videoId).then(commentPage => {
            console.log(commentPage.comments)
            return commentScrapper(videoId, commentPage.nextPageToken)
        }).then(commentPage => {
            console.log(commentPage.comments)
        })
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
                    {matchedCaptions.map(c => <button className="btn btn-success" onClick={() => setStartTime(c.start)}
                                                      type="submit">{c.matchedPhrase} - {c.start}</button>)}
                    <div>
                        {transcript.length > 0 ?
                            <button type="submit" onClick={getKeyNotes}>Get Keynotes</button> : null}
                    </div>
                    <button type="submit" onClick={getSentimentAnalysis}>Analyse Sentiment</button>
                </div>
            </div>
        </div>
    );
};

export default App;
